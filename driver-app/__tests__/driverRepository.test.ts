import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
  } from 'vitest';
  
  const mocks = vi.hoisted(() => ({
    getUser: vi.fn(),
    usersSelect: vi.fn(),
    usersEq: vi.fn(),
    usersSingle: vi.fn(),
  
    ordersSelect: vi.fn(),
    ordersEq: vi.fn(),
    ordersOrder: vi.fn(),
  
    from: vi.fn(),
  
    randomUUID: vi.fn(() => 'test-document-id'),
  }));
  
  vi.mock('../src/services/supabase', () => ({
    supabase: {
      auth: {
        getUser: mocks.getUser,
      },
      from: mocks.from,
    },
  }));
  
  vi.mock('expo-crypto', () => ({
    randomUUID: mocks.randomUUID,
  }));
  
  import { DriverRepository } from '../src/repositories/DriverRepository';
  
  function setupAuthenticatedDriver() {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'auth-user-123',
        },
      },
      error: null,
    });
  
    mocks.usersSelect.mockReturnValue({
      eq: mocks.usersEq,
    });
  
    mocks.usersEq.mockReturnValue({
      single: mocks.usersSingle,
    });
  
    mocks.usersSingle.mockResolvedValue({
      data: {
        user_id: 'driver-123',
      },
      error: null,
    });
  
    mocks.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: mocks.usersSelect,
        };
      }
  
      if (table === 'orders') {
        return {
          select: mocks.ordersSelect,
        };
      }
  
      throw new Error(`Unexpected Supabase table: ${table}`);
    });
  }
  
  function setupOrdersQuery(
    orders: any[],
    error: any = null
  ) {
    mocks.ordersSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: mocks.ordersOrder,
        }),
      }),
    });
  
    mocks.ordersOrder.mockResolvedValue({
      data: orders,
      error,
    });
  }
  
  describe('DriverRepository.getEarnings', () => {
    beforeEach(() => {
      vi.clearAllMocks();
  
      setupAuthenticatedDriver();
    });
  
    test('loads completed orders for the authenticated driver', async () => {
      const orders = [
        {
          order_id: 'order-1',
          driver_id: 'driver-123',
          status: 'COMPLETED',
          rand_amount: 652.85,
          volume_litres: 20,
          delivered_at: new Date().toISOString(),
          placed_at: new Date().toISOString(),
          fuel_types: {
            name: 'Unleaded 95',
          },
          addresses: {
            street_name: '123 Main Road',
            suburb: 'Durban North',
          },
        },
      ];
  
      setupOrdersQuery(orders);
  
      const repository = DriverRepository.getInstance();
  
      const result = await repository.getEarnings();
  
      expect(result.totalDeliveries).toBe(1);
      expect(result.todayEarnings).toBeCloseTo(652.85);
      expect(result.weekEarnings).toBeCloseTo(652.85);
      expect(result.monthEarnings).toBeCloseTo(652.85);
  
      expect(mocks.getUser).toHaveBeenCalledTimes(1);
      expect(mocks.from).toHaveBeenCalledWith('users');
      expect(mocks.from).toHaveBeenCalledWith('orders');
    });
  
    test('uses rand_amount as the earnings value', async () => {
      const orders = [
        {
          order_id: 'order-1',
          driver_id: 'driver-123',
          status: 'COMPLETED',
          rand_amount: 100.5,
          volume_litres: 10,
          delivered_at: new Date().toISOString(),
          placed_at: new Date().toISOString(),
          fuel_types: {
            name: 'Diesel',
          },
          addresses: {
            street_name: '1 Test Street',
            suburb: 'Umhlanga',
          },
        },
        {
          order_id: 'order-2',
          driver_id: 'driver-123',
          status: 'COMPLETED',
          rand_amount: 250.75,
          volume_litres: 20,
          delivered_at: new Date().toISOString(),
          placed_at: new Date().toISOString(),
          fuel_types: {
            name: 'Unleaded 95',
          },
          addresses: {
            street_name: '2 Test Street',
            suburb: 'Durban North',
          },
        },
      ];
  
      setupOrdersQuery(orders);
  
      const repository = DriverRepository.getInstance();
  
      const result = await repository.getEarnings();
  
      expect(result.todayEarnings).toBeCloseTo(351.25);
      expect(result.weekEarnings).toBeCloseTo(351.25);
      expect(result.monthEarnings).toBeCloseTo(351.25);
    });
  
    test('returns zero earnings when there are no completed orders', async () => {
      setupOrdersQuery([]);
  
      const repository = DriverRepository.getInstance();
  
      const result = await repository.getEarnings();
  
      expect(result.todayEarnings).toBe(0);
      expect(result.weekEarnings).toBe(0);
      expect(result.monthEarnings).toBe(0);
      expect(result.totalDeliveries).toBe(0);
      expect(result.deliveryHistory).toEqual([]);
    });
  
    test('throws when the completed orders query fails', async () => {
      const databaseError = new Error(
        'Database connection failed'
      );
  
      setupOrdersQuery([], databaseError);
  
      const repository = DriverRepository.getInstance();
  
      await expect(
        repository.getEarnings()
      ).rejects.toThrow('Database connection failed');
    });
  
    test('maps completed order history correctly', async () => {
      const deliveredAt = new Date().toISOString();
  
      const orders = [
        {
          order_id: 'order-history-1',
          driver_id: 'driver-123',
          status: 'COMPLETED',
          rand_amount: 499.99,
          volume_litres: 15,
          delivered_at: deliveredAt,
          placed_at: deliveredAt,
          fuel_types: {
            name: 'Diesel',
          },
          addresses: {
            street_name: '45 Florida Road',
            suburb: 'Morningside',
          },
        },
      ];
  
      setupOrdersQuery(orders);
  
      const repository = DriverRepository.getInstance();
  
      const result = await repository.getEarnings();
  
      expect(result.deliveryHistory).toHaveLength(1);
  
      expect(result.deliveryHistory[0]).toEqual({
        id: 'order-history-1',
        address: '45 Florida Road, Morningside',
        date: deliveredAt,
        litres: 15,
        fuelType: 'Diesel',
        amount: 499.99,
      });
    });
  
    test('uses delivered_at when calculating earnings periods', async () => {
      const now = new Date();
  
      const orders = [
        {
          order_id: 'order-today',
          driver_id: 'driver-123',
          status: 'COMPLETED',
          rand_amount: 100,
          volume_litres: 10,
          delivered_at: now.toISOString(),
          placed_at: now.toISOString(),
          fuel_types: {
            name: 'Diesel',
          },
          addresses: {
            street_name: 'Today Street',
            suburb: 'Durban',
          },
        },
      ];
  
      setupOrdersQuery(orders);
  
      const repository = DriverRepository.getInstance();
  
      const result = await repository.getEarnings();
  
      expect(result.todayEarnings).toBe(100);
      expect(result.weekEarnings).toBe(100);
      expect(result.monthEarnings).toBe(100);
    });
  });