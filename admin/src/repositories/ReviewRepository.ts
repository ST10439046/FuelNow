import { supabase } from '../services/supabase';

export interface ReviewModel {
  id: string;
  orderId: string;
  date: string;
  rating: number;
  comment: string;
  customerName: string;
  driverName: string;
  flagged: boolean;
}

export class ReviewRepository {
  private static instance: ReviewRepository;

  private constructor() {}

  public static getInstance(): ReviewRepository {
    if (!ReviewRepository.instance) {
      ReviewRepository.instance = new ReviewRepository();
    }

    return ReviewRepository.instance;
  }

  public async getReviews(): Promise<ReviewModel[]> {
    const { data, error } = await supabase.rpc(
      'get_admin_reviews'
    );

    if (error) {
      console.error(
        'Error fetching reviews:',
        error
      );

      return [];
    }

    return (data || []).map((r: any) => ({
      id: r.review_id,
      orderId: r.order_id,
      date:
        r.placed_at ||
        r.created_at ||
        new Date().toISOString(),
      rating: Number(r.rating ?? 0),
      comment: r.comment || '',
      customerName:
        r.customer_name ||
        'Unknown',
      driverName:
        r.driver_name ||
        'Unknown',
      flagged:
        r.status === 'flagged',
    }));
  }

  public async setReviewStatus(
    id: string,
    status: string
  ): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .update({
        status,
      })
      .eq('review_id', id);

    if (error) {
      console.error(
        'Error updating review status:',
        error
      );

      throw error;
    }
  }

  public async deleteReview(
    id: string
  ): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('review_id', id);

    if (error) {
      console.error(
        'Error deleting review:',
        error
      );

      throw error;
    }
  }
}

export const reviewRepository =
  ReviewRepository.getInstance();