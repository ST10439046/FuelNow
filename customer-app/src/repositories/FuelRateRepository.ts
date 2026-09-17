import { supabase } from '../services/supabase';

export interface FuelRateModel {
  id: string;
  type: string;
  pricePerLitre: number;
  change: number;
  trend: 'up' | 'down' | 'flat';
  changeSource?: string;
  effectiveDate?: string;
}

export class FuelRateRepository {
  private static instance: FuelRateRepository;

  private constructor() {}

  public static getInstance(): FuelRateRepository {
    if (!FuelRateRepository.instance) {
      FuelRateRepository.instance = new FuelRateRepository();
    }

    return FuelRateRepository.instance;
  }

  /**
   * Gets the latest fuel rate for each fuel type
   * from Supabase.
   */
  public async getRates(): Promise<FuelRateModel[]> {
    const { data, error } = await supabase.rpc(
      'get_all_fuel_rates'
    );

    if (error) {
      console.error(
        'Failed to fetch fuel rates:',
        error
      );

      throw error;
    }

    if (!data) {
      return [];
    }

    // get_all_fuel_rates returns a JSON array
    const rates = Array.isArray(data) ? data : [];

    return rates.map((rate: any) => ({
  id: rate.fuel_type_id,
  type: rate.fuel_type_name,
  pricePerLitre: Number(rate.price_per_litre),
  change: 0,
  trend: 'flat' as const,
  changeSource: rate.source,
  effectiveDate: undefined,
}));
  }
}

export const fuelRateRepository =
  FuelRateRepository.getInstance();