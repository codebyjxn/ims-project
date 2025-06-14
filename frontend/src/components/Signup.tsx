import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService, { SignupFanData, SignupOrganizerData } from '../services/api/auth';
import './Login.css';

type UserType = 'fan' | 'organizer';

type FormData = (SignupFanData | SignupOrganizerData) & {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<UserType>('fan');
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    ...(userType === 'fan' 
      ? { username: '', preferredGenre: '', phoneNumber: '' }
      : { organizationName: '', contactInfo: '' }
    )
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserTypeChange = (type: UserType) => {
    setUserType(type);
    // Reset form data when switching user type
    setFormData({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      ...(type === 'fan'
        ? { username: '', preferredGenre: '', phoneNumber: '' }
        : { organizationName: '', contactInfo: '' }
      )
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await (userType === 'fan'
        ? authService.signupFan(formData as SignupFanData)
        : authService.signupOrganizer(formData as SignupOrganizerData)
      );
      
      login(response.token, response.user);
      
      // Navigate based on user type
      if (response.user.userType === 'admin') {
        navigate('/admin');
      } else if (response.user.userType === 'fan') {
        navigate('/dashboard');
      } else if (response.user.userType === 'organizer') {
        navigate('/organizers');
      } else {
        navigate('/'); // Default to landing page for other user types
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Link to="/" className="back-to-home">← Back to Home</Link>
      <div className="auth-box">
        <h2>Create Account</h2>
        {error && <div className="error-message">{error}</div>}
        
        <div className="user-type-toggle">
          <button
            className={`toggle-button ${userType === 'fan' ? 'active' : ''}`}
            onClick={() => handleUserTypeChange('fan')}
            type="button"
          >
            Fan
          </button>
          <button
            className={`toggle-button ${userType === 'organizer' ? 'active' : ''}`}
            onClick={() => handleUserTypeChange('organizer')}
            type="button"
          >
            Organizer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              placeholder="Enter your first name"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              placeholder="Enter your last name"
              disabled={isLoading}
            />
          </div>

          {userType === 'fan' ? (
            <>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={(formData as SignupFanData).username || ''}
                  onChange={handleChange}
                  required
                  placeholder="Choose a username"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="preferredGenre">Preferred Genre</label>
                <input
                  type="text"
                  id="preferredGenre"
                  name="preferredGenre"
                  value={(formData as SignupFanData).preferredGenre || ''}
                  onChange={handleChange}
                  placeholder="What music do you like?"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={(formData as SignupFanData).phoneNumber || ''}
                  onChange={handleChange}
                  placeholder="Your phone number"
                  disabled={isLoading}
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="organizationName">Organization Name</label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={(formData as SignupOrganizerData).organizationName || ''}
                  onChange={handleChange}
                  required
                  placeholder="Enter organization name"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactInfo">Contact Information</label>
                <input
                  type="text"
                  id="contactInfo"
                  name="contactInfo"
                  value={(formData as SignupOrganizerData).contactInfo || ''}
                  onChange={handleChange}
                  required
                  placeholder="Enter contact information"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Already have an account?{' '}
            <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
} 