import { Request, Response } from 'express';
import { AnalyticsRepositoryFactory } from '../repositories/analytics-factory';

export const getUpcomingConcertsPerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    const analyticsRepo = await AnalyticsRepositoryFactory.getRepository();
    const performanceData = await analyticsRepo.getUpcomingConcertsPerformance();
    res.status(200).json(performanceData);
  } catch (error) {
    console.error('Error fetching upcoming concerts performance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 