export interface AddressModel {
  id: string;
  label: 'Home' | 'Work' | 'Other' | 'Site A' | 'Depot';
  street: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  coordinates: { lat: number; lng: number };
}

export interface PaymentMethodModel {
  id: string;
  type: 'card' | 'eft' | 'mobile_money';
  label: string;
  last4?: string;
  brand?: 'visa' | 'mastercard';
  isDefault: boolean;
}

export interface UserModel {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  loyaltyTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  companyName: string;
  savedAddresses: AddressModel[];
  paymentMethods: PaymentMethodModel[];
}

export class UserRepository {
  private static instance: UserRepository;

  private user: UserModel = {
    id: 'usr_001',
    name: 'Muhammed Khan',
    email: 'muhammedkhan@impactdurban.co.za',
    phone: '082 456 7890',
    loyaltyPoints: 340,
    loyaltyTier: 'Silver',
    companyName: 'Southgate Civils',
    savedAddresses: [
      {
        id: 'addr_001',
        label: 'Home',
        street: '18 Kenneth Kaunda Road',
        suburb: 'Durban North',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        postalCode: '4051',
        coordinates: { lat: -29.8000, lng: 31.0333 },
      },
      {
        id: 'addr_002',
        label: 'Work',
        street: '45 Jan Hofmeyr Road',
        suburb: 'Westville',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        postalCode: '3629',
        coordinates: { lat: -29.8256, lng: 30.9312 },
      },
      {
        id: 'addr_003',
        label: 'Site A',
        street: '12 Palm Boulevard',
        suburb: 'Umhlanga Ridge',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        postalCode: '4319',
        coordinates: { lat: -29.7265, lng: 31.0690 },
      },
    ],
    paymentMethods: [
      {
        id: 'pm_001',
        type: 'card',
        label: 'FNB Corporate Cheque ••• 4821',
        last4: '4821',
        brand: 'visa',
        isDefault: true,
      },
      {
        id: 'pm_002',
        type: 'card',
        label: 'Nedbank Business ••• 9934',
        last4: '9934',
        brand: 'mastercard',
        isDefault: false,
      },
      {
        id: 'pm_003',
        type: 'mobile_money',
        label: 'SnapScan (Direct Pay)',
        isDefault: false,
      },
    ],
  };

  private constructor() {}

  public static getInstance(): UserRepository {
    if (!UserRepository.instance) {
      UserRepository.instance = new UserRepository();
    }
    return UserRepository.instance;
  }

  public async getUser(): Promise<UserModel> {
    return { ...this.user };
  }

  public async addPoints(points: number): Promise<number> {
    this.user.loyaltyPoints += points;
    if (this.user.loyaltyPoints >= 2500) this.user.loyaltyTier = 'Platinum';
    else if (this.user.loyaltyPoints >= 1000) this.user.loyaltyTier = 'Gold';
    else if (this.user.loyaltyPoints >= 500) this.user.loyaltyTier = 'Silver';
    else this.user.loyaltyTier = 'Bronze';
    return this.user.loyaltyPoints;
  }

  public async addAddress(address: Omit<AddressModel, 'id'>): Promise<AddressModel> {
    const newAddr: AddressModel = {
      ...address,
      id: `addr_${Date.now().toString().slice(-4)}`,
    };
    this.user.savedAddresses.push(newAddr);
    return newAddr;
  }

  public async addPaymentMethod(pm: Omit<PaymentMethodModel, 'id'>): Promise<PaymentMethodModel> {
    const newPm: PaymentMethodModel = {
      ...pm,
      id: `pm_${Date.now().toString().slice(-4)}`,
    };
    this.user.paymentMethods.push(newPm);
    return newPm;
  }
}

export const userRepository = UserRepository.getInstance();
