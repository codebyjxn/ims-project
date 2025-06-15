import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { config } from '../config';
import { getUsersCollection, IUser } from '../models/mongodb-schemas';
import { getPool } from '../lib/postgres';
import { migrationStatus } from '../services/migration-status';
import { mongoManager } from '../lib/mongodb-connection';

export class AuthController {
  // Register a new user
  async signup(req: Request, res: Response): Promise<void> {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        userType,
        username,
        preferredGenre,
        phoneNumber,
        organizationName,
        contactInfo
      } = req.body;

      if (!email || !password || !firstName || !lastName || !userType) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      if (!['fan', 'organizer', 'admin'].includes(userType)) {
        res.status(400).json({ error: 'Invalid user type' });
        return;
      }

      const currentDb = migrationStatus.getDatabaseType();
      let existingUser;

      if (currentDb === 'mongodb') {
        const usersCollection = await getUsersCollection();
        existingUser = await usersCollection.findOne({ email });
      } else {
        const pool = getPool();
        const result = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
        existingUser = result.rows.length > 0 ? result.rows[0] : null;
      }

      if (existingUser) {
        res.status(409).json({ error: 'User already exists' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const userId = randomUUID();
      let newUser: any;

      if (currentDb === 'mongodb') {
        const usersCollection = await getUsersCollection();

        newUser = {
          _id: userId,
          email,
          user_password: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          registration_date: new Date(),
          user_type: userType
        };

        if (userType === 'fan') {
          if (!username) {
            res.status(400).json({ error: 'Username is required for fans' });
            return;
          }

          const existingUsername = await usersCollection.findOne({ 'fan_details.username': username });
          if (existingUsername) {
            res.status(409).json({ error: 'Username already taken' });
            return;
          }

          const referralCode = `${username}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();

          newUser.fan_details = {
            username,
            preferred_genre: preferredGenre || '',
            phone_number: phoneNumber || '',
            referral_code: referralCode,
            referral_points: 0,
            referral_code_used: false
          };
        } else if (userType === 'organizer') {
          if (!organizationName || !contactInfo) {
            res.status(400).json({ error: 'Organization name and contact info are required for organizers' });
            return;
          }

          newUser.organizer_details = {
            organization_name: organizationName,
            contact_info: contactInfo
          };
        }

        await usersCollection.insertOne(newUser);
      } else {
        const pool = getPool();

        const userResult = await pool.query(
          'INSERT INTO users (user_id, email, user_password, first_name, last_name, registration_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [userId, email, hashedPassword, firstName, lastName, new Date()]
        );

        newUser = userResult.rows[0];
        newUser.user_type = userType;

        if (userType === 'fan') {
          if (!username) {
            res.status(400).json({ error: 'Username is required for fans' });
            return;
          }

          const usernameCheck = await pool.query('SELECT user_id FROM fans WHERE username = $1', [username]);
          if (usernameCheck.rows.length > 0) {
            res.status(409).json({ error: 'Username already taken' });
            return;
          }

          const referralCode = `${username}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();

          await pool.query(
            'INSERT INTO fans (user_id, username, preferred_genre, phone_number, referral_code, referral_points, referral_code_used) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [userId, username, preferredGenre || '', phoneNumber || '', referralCode, 0, false]
          );

          newUser.fan_details = {
            username,
            preferred_genre: preferredGenre || '',
            phone_number: phoneNumber || '',
            referral_code: referralCode,
            referral_points: 0,
            referral_code_used: false
          };
        } else if (userType === 'organizer') {
          if (!organizationName || !contactInfo) {
            res.status(400).json({ error: 'Organization name and contact info are required for organizers' });
            return;
          }

          await pool.query(
            'INSERT INTO organizers (user_id, organization_name, contact_info) VALUES ($1, $2, $3)',
            [userId, organizationName, contactInfo]
          );

          newUser.organizer_details = {
            organization_name: organizationName,
            contact_info: contactInfo
          };
        }
      }

      const signOptions: SignOptions = { expiresIn: config.jwt.expiresIn as any };
      const userIdForToken = currentDb === 'mongodb' ? newUser._id : newUser.user_id;
      const token = jwt.sign(
        {
          userId: String(userIdForToken),
          email: String(newUser.email),
          userType: String(newUser.user_type)
        },
        config.jwt.secret as string,
        signOptions
      );

      res.status(201).json({
        message: 'User created successfully',
        database: currentDb,
        token,
        user: {
          id: String(userIdForToken),
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          userType: newUser.user_type,
          ...(newUser.fan_details ? {
            fanDetails: {
              username: newUser.fan_details.username,
              preferredGenre: newUser.fan_details.preferred_genre,
              phoneNumber: newUser.fan_details.phone_number,
              referralCode: newUser.fan_details.referral_code,
              referralPoints: newUser.fan_details.referral_points
            }
          } : {}),
          ...(newUser.organizer_details ? {
            organizerDetails: {
              organizationName: newUser.organizer_details.organization_name,
              contactInfo: newUser.organizer_details.contact_info
            }
          } : {})
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Login existing user
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const currentDb = migrationStatus.getDatabaseType();
      let user: any;

      if (currentDb === 'mongodb') {
        try {
          const collection = await mongoManager.getCollection<IUser>('users');
          user = await collection.findOne({ email });

          if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
          }

          const isValidPassword = await bcrypt.compare(password, user.user_password);
          if (!isValidPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
          }

          await collection.updateOne(
            { _id: user._id },
            { $set: { last_login: new Date() } }
          );
        } catch (mongoError) {
          console.error('MongoDB connection error in login:', mongoError);
          res.status(500).json({ error: 'Database connection error' });
          return;
        }
      } else {
        const pool = getPool();

        const result = await pool.query(`
          SELECT u.*, 
                 f.username, f.preferred_genre, f.phone_number, f.referral_code, f.referral_points, f.referral_code_used,
                 o.organization_name, o.contact_info
          FROM users u
          LEFT JOIN fans f ON u.user_id = f.user_id
          LEFT JOIN organizers o ON u.user_id = o.user_id
          WHERE u.email = $1
        `, [email]);

        if (result.rows.length === 0) {
          res.status(401).json({ error: 'Invalid credentials' });
          return;
        }

        user = result.rows[0];

        const isValidPassword = await bcrypt.compare(password, user.user_password);
        if (!isValidPassword) {
          res.status(401).json({ error: 'Invalid credentials' });
          return;
        }

        await pool.query(
          'UPDATE users SET last_login = $1 WHERE user_id = $2',
          [new Date(), user.user_id]
        );

        if (user.username) {
          user.user_type = 'fan';
          user.fan_details = {
            username: user.username,
            preferred_genre: user.preferred_genre,
            phone_number: user.phone_number,
            referral_code: user.referral_code,
            referral_points: user.referral_points,
            referral_code_used: user.referral_code_used
          };
        } else if (user.organization_name) {
          user.user_type = 'organizer';
          user.organizer_details = {
            organization_name: user.organization_name,
            contact_info: user.contact_info
          };
        } else {
          user.user_type = 'admin';
        }
      }

      const signOptions: SignOptions = { expiresIn: config.jwt.expiresIn as any };
      const userIdForToken = currentDb === 'mongodb' ? user._id : user.user_id;
      const token = jwt.sign(
        {
          userId: String(userIdForToken),
          email: String(user.email),
          userType: String(user.user_type)
        },
        config.jwt.secret as string,
        signOptions
      );

      res.json({
        message: 'Login successful',
        database: currentDb,
        token,
        user: {
          id: String(userIdForToken),
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: user.user_type,
          ...(user.fan_details ? {
            fanDetails: {
              username: user.fan_details.username,
              preferredGenre: user.fan_details.preferred_genre,
              phoneNumber: user.fan_details.phone_number,
              referralCode: user.fan_details.referral_code,
              referralPoints: user.fan_details.referral_points
            }
          } : {}),
          ...(user.organizer_details ? {
            organizerDetails: {
              organizationName: user.organizer_details.organization_name,
              contactInfo: user.organizer_details.contact_info
            }
          } : {})
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
