jest.mock('../src/services/supabase', () => ({
    supabase: {
      from: jest.fn(),
    },
  }));
  
  import { supabase } from '../src/services/supabase';
  import {
    DriverRepository,
  } from '../src/repositories/DriverRepository';
  
  describe('DriverRepository', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    describe('getEarnings', () => {
      test('only counts COMPLETED orders and uses rand_amount', async () => {
        const now = new Date();
  
        const todayOrderDate = new Date(
          now.getTime() - 60 * 60 * 1000
        ).toISOString();
  
        const completedOrders = [
          {
            order_id: 'order-001',
            driver_id: 'driver-001',
            status: 'COMPLETED',
            rand_amount: 652.85,
            volume_litres: 20,
            delivered_at: todayOrderDate,
            placed_at: todayOrderDate,
            fuel_types: {
              name: 'Petrol 95',
            },
            addresses: {
              street_name: 'Florida Road',
              suburb: 'Morningside',
            },
          },
          {
            order_id: 'order-002',
            driver_id: 'driver-001',
            status: 'COMPLETED',
            rand_amount: 500.00,
            volume_litres: 15,
            delivered_at: todayOrderDate,
            placed_at: todayOrderDate,
            fuel_types: {
              name: 'Diesel 50ppm',
            },
            addresses: {
              street_name: 'Umhlanga Rocks Drive',
              suburb: 'Umhlanga',
            },
          },
        ];
  
        const query = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: completedOrders,
            error: null,
          }),
        };
  
        (supabase.from as jest.Mock).mockReturnValue(
          query
        );
  
        const repository =
          DriverRepository.getInstance();
  
        jest
          .spyOn(
            repository as any,
            'getCurrentUserId'
          )
          .mockResolvedValue('driver-001');
  
        const earnings =
          await repository.getEarnings();
  
        expect(
          supabase.from
        ).toHaveBeenCalledWith('orders');
  
        expect(
          query.eq
        ).toHaveBeenCalledWith(
          'driver_id',
          'driver-001'
        );
  
        expect(
          query.eq
        ).toHaveBeenCalledWith(
          'status',
          'COMPLETED'
        );
  
        expect(
          earnings.todayEarnings
        ).toBe(1152.85);
  
        expect(
          earnings.weekEarnings
        ).toBe(1152.85);
  
        expect(
          earnings.monthEarnings
        ).toBe(1152.85);
  
        expect(
          earnings.totalDeliveries
        ).toBe(2);
      });
  
      test('returns zero when there are no completed orders', async () => {
        const query = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
  
        (supabase.from as jest.Mock).mockReturnValue(
          query
        );
  
        const repository =
          DriverRepository.getInstance();
  
        jest
          .spyOn(
            repository as any,
            'getCurrentUserId'
          )
          .mockResolvedValue('driver-001');
  
        const earnings =
          await repository.getEarnings();
  
        expect(
          earnings.todayEarnings
        ).toBe(0);
  
        expect(
          earnings.weekEarnings
        ).toBe(0);
  
        expect(
          earnings.monthEarnings
        ).toBe(0);
  
        expect(
          earnings.totalDeliveries
        ).toBe(0);
  
        expect(
          earnings.deliveryHistory
        ).toHaveLength(0);
      });
  
      test('uses rand_amount for delivery history amount', async () => {
        const deliveredAt =
          new Date().toISOString();
  
        const completedOrders = [
          {
            order_id: 'order-003',
            driver_id: 'driver-001',
            status: 'COMPLETED',
            rand_amount: 899.99,
            volume_litres: 30,
            delivered_at: deliveredAt,
            placed_at: deliveredAt,
            fuel_types: {
              name: 'Petrol 93',
            },
            addresses: {
              street_name: 'West Street',
              suburb: 'Durban Central',
            },
          },
        ];
  
        const query = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: completedOrders,
            error: null,
          }),
        };
  
        (supabase.from as jest.Mock).mockReturnValue(
          query
        );
  
        const repository =
          DriverRepository.getInstance();
  
        jest
          .spyOn(
            repository as any,
            'getCurrentUserId'
          )
          .mockResolvedValue('driver-001');
  
        const earnings =
          await repository.getEarnings();
  
        expect(
          earnings.deliveryHistory[0].amount
        ).toBe(899.99);
  
        expect(
          earnings.deliveryHistory[0].litres
        ).toBe(30);
  
        expect(
          earnings.deliveryHistory[0].fuelType
        ).toBe('Petrol 93');
  
        expect(
          earnings.deliveryHistory[0].address
        ).toBe(
          'West Street, Durban Central'
        );
      });
  
      test('throws when Supabase returns an error', async () => {
        const databaseError =
          new Error(
            'Database unavailable'
          );
  
        const query = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: null,
            error: databaseError,
          }),
        };
  
        (supabase.from as jest.Mock).mockReturnValue(
          query
        );
  
        const repository =
          DriverRepository.getInstance();
  
        jest
          .spyOn(
            repository as any,
            'getCurrentUserId'
          )
          .mockResolvedValue('driver-001');
  
        await expect(
          repository.getEarnings()
        ).rejects.toThrow(
          'Database unavailable'
        );
      });
    });
  });