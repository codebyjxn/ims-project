import { request } from './base';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export interface ReferralValidation {
    valid: boolean;
    message?: string;
    error?: string;
    discount?: number;
    referrer?: {
      id: string;
      username: string;
      name: string;
    };
}

class ReferralService {
    async validateReferralCode(code: string): Promise<ReferralValidation> {
        return request<ReferralValidation>('/referrals/validate', {
          method: 'POST',
          body: JSON.stringify({ referralCode: code }),
        });
    }
    
    async applyReferralCode(code: string, fanId: string): Promise<any> {
        return request<any>('/referrals/apply', {
          method: 'POST',
          body: JSON.stringify({ code, fanId }),
        });
    }
}

const referralService = new ReferralService();
export default referralService; 