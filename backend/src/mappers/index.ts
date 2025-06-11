// src/mapper/index.ts
// ========== IMPORTS ==========
import {
  UserDTO,
  FanDTO,
  OrganizerDTO,
  ArtistDTO,
  ArenaDTO,
  ConcertDTO,
  TicketDTO,
  ConcertArtistDTO,
  ZonePricingDTO
} from '../dto/index';

import {
  PostgresUser,
  PostgresFan,
  PostgresOrganizer,
  PostgresArtist,
  PostgresArena,
  PostgresZone,
  PostgresConcert,
  PostgresTicket
} from '../entities/postgres';

import {
  IUser,
  IArtist,
  IArena,
  IConcert,
  ITicket
} from '../entities/mongodb';

// ========== POSTGRESQL MAPPERS ==========

export class PostgresMappers {
  
  static toUserDTO(user: PostgresUser, fan?: PostgresFan, organizer?: PostgresOrganizer): UserDTO | FanDTO | OrganizerDTO {
    const baseUser: UserDTO = {
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type as 'fan' | 'organizer' | 'admin',
      registration_date: user.registration_date.toISOString(),
      last_login: user.last_login?.toISOString()
    };

    if (user.user_type === 'fan' && fan) {
      return {
        ...baseUser,
        user_type: 'fan',
        username: fan.username,
        preferred_genre: fan.preferred_genre,
        phone_number: fan.phone_number,
        referral_code: fan.referral_code,
        referred_by: fan.referred_by,
        referral_points: fan.referral_points,
        referral_code_used: fan.referral_code_used
      } as FanDTO;
    }

    if (user.user_type === 'organizer' && organizer) {
      return {
        ...baseUser,
        user_type: 'organizer',
        organization_name: organizer.organization_name,
        contact_info: organizer.contact_info
      } as OrganizerDTO;
    }

    return baseUser;
  }

  static toFanDTO(user: PostgresUser, fan: PostgresFan): FanDTO {
    return {
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: 'fan',
      registration_date: user.registration_date.toISOString(),
      last_login: user.last_login?.toISOString(),
      username: fan.username,
      preferred_genre: fan.preferred_genre,
      phone_number: fan.phone_number,
      referral_code: fan.referral_code,
      referred_by: fan.referred_by,
      referral_points: fan.referral_points,
      referral_code_used: fan.referral_code_used
    };
  }

  static toOrganizerDTO(user: PostgresUser, organizer: PostgresOrganizer): OrganizerDTO {
    return {
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: 'organizer',
      registration_date: user.registration_date.toISOString(),
      last_login: user.last_login?.toISOString(),
      organization_name: organizer.organization_name,
      contact_info: organizer.contact_info
    };
  }

  static toArtistDTO(artist: PostgresArtist): ArtistDTO {
    return {
      artist_id: artist.artist_id,
      artist_name: artist.artist_name,
      genre: artist.genre
    };
  }

  static toArenaDTO(arena: PostgresArena, zones: PostgresZone[]): ArenaDTO {
    return {
      arena_id: arena.arena_id,
      arena_name: arena.arena_name,
      arena_location: arena.arena_location,
      total_capacity: arena.total_capacity,
      zones: zones.map(zone => ({
        zone_name: zone.zone_name,
        capacity_per_zone: zone.capacity_per_zone
      }))
    };
  }

  static toConcertDTO(
    concert: PostgresConcert,
    artists: PostgresArtist[],
    zonePricing: Array<{ zone_name: string; price: number }>
  ): ConcertDTO {
    return {
      concert_id: concert.concert_id,
      concert_date: concert.concert_date.toISOString(),
      time: concert.time,
      description: concert.description,
      organizer_id: concert.organizer_id,
      arena_id: concert.arena_id,
      artists: artists.map(artist => ({
        artist_id: artist.artist_id,
        artist_name: artist.artist_name,
        genre: artist.genre
      })),
      zone_pricing: zonePricing
    };
  }

  static toTicketDTO(
    ticket: PostgresTicket,
    price: number,
    fanUsername?: string,
    concertDate?: Date
  ): TicketDTO {
    return {
      ticket_id: ticket.ticket_id,
      fan_id: ticket.fan_id,
      concert_id: ticket.concert_id,
      arena_id: ticket.arena_id,
      zone_name: ticket.zone_name,
      purchase_date: ticket.purchase_date.toISOString(),
      referral_code_used: ticket.referral_code_used,
      price: price,
      fan_username: fanUsername,
      concert_date: concertDate?.toISOString()
    };
  }
}

// ========== MONGODB MAPPERS ==========

export class MongoMappers {
  
  static toUserDTO(user: IUser): UserDTO | FanDTO | OrganizerDTO {
    const baseUser: UserDTO = {
      user_id: user._id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type,
      registration_date: user.registration_date.toISOString(),
      last_login: user.last_login?.toISOString()
    };

    if (user.user_type === 'fan' && user.fan_details) {
      return {
        ...baseUser,
        user_type: 'fan',
        username: user.fan_details.username,
        preferred_genre: user.fan_details.preferred_genre,
        phone_number: user.fan_details.phone_number,
        referral_code: user.fan_details.referral_code,
        referred_by: user.fan_details.referred_by,
        referral_points: user.fan_details.referral_points,
        referral_code_used: user.fan_details.referral_code_used
      } as FanDTO;
    }

    if (user.user_type === 'organizer' && user.organizer_details) {
      return {
        ...baseUser,
        user_type: 'organizer',
        organization_name: user.organizer_details.organization_name,
        contact_info: user.organizer_details.contact_info
      } as OrganizerDTO;
    }

    return baseUser;
  }

  static toFanDTO(user: IUser): FanDTO | null {
    if (user.user_type !== 'fan' || !user.fan_details) {
      return null;
    }

    return {
      user_id: user._id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: 'fan',
      registration_date: user.registration_date.toISOString(),
      last_login: user.last_login?.toISOString(),
      username: user.fan_details.username,
      preferred_genre: user.fan_details.preferred_genre,
      phone_number: user.fan_details.phone_number,
      referral_code: user.fan_details.referral_code,
      referred_by: user.fan_details.referred_by,
      referral_points: user.fan_details.referral_points,
      referral_code_used: user.fan_details.referral_code_used
    };
  }

  static toOrganizerDTO(user: IUser): OrganizerDTO | null {
    if (user.user_type !== 'organizer' || !user.organizer_details) {
      return null;
    }

    return {
      user_id: user._id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: 'organizer',
      registration_date: user.registration_date.toISOString(),
      last_login: user.last_login?.toISOString(),
      organization_name: user.organizer_details.organization_name,
      contact_info: user.organizer_details.contact_info
    };
  }

  static toArtistDTO(artist: IArtist): ArtistDTO {
    return {
      artist_id: artist._id,
      artist_name: artist.artist_name,
      genre: artist.genre
    };
  }

  static toArenaDTO(arena: IArena): ArenaDTO {
    return {
      arena_id: arena._id,
      arena_name: arena.arena_name,
      arena_location: arena.arena_location,
      total_capacity: arena.total_capacity,
      zones: arena.zones.map(zone => ({
        zone_name: zone.zone_name,
        capacity_per_zone: zone.capacity_per_zone
      }))
    };
  }

  static toConcertDTO(concert: IConcert): ConcertDTO {
    return {
      concert_id: concert._id,
      concert_date: concert.concert_date.toISOString(),
      time: concert.time,
      description: concert.description,
      organizer_id: concert.organizer_id,
      arena_id: concert.arena_id,
      artists: concert.artists.map(artist => ({
        artist_id: artist.artist_id,
        artist_name: artist.artist_name,
        genre: artist.genre
      })),
      zone_pricing: concert.zone_pricing
    };
  }

  static toTicketDTO(ticket: ITicket): TicketDTO {
    return {
      ticket_id: ticket._id,
      fan_id: ticket.fan_id,
      concert_id: ticket.concert_id,
      arena_id: ticket.arena_id,
      zone_name: ticket.zone_name,
      purchase_date: ticket.purchase_date.toISOString(),
      referral_code_used: ticket.referral_code_used,
      price: ticket.price,
      fan_username: ticket.fan_username,
      concert_date: ticket.concert_date.toISOString()
    };
  }
}

// ========== UTILITY MAPPER FUNCTIONS ==========

export class MapperUtils {
  /**
   * Maps an array of entities to DTOs using the provided mapper function
   */
  static mapArray<TEntity, TDTO>(entities: TEntity[], mapperFn: (entity: TEntity) => TDTO): TDTO[] {
    return entities.map(mapperFn);
  }

  /**
   * Maps an entity to DTO with null safety
   */
  static mapNullable<TEntity, TDTO>(
    entity: TEntity | null | undefined, 
    mapperFn: (entity: TEntity) => TDTO
  ): TDTO | null {
    return entity ? mapperFn(entity) : null;
  }

  /**
   * Maps an array with null safety
   */
  static mapArrayNullable<TEntity, TDTO>(
    entities: TEntity[] | null | undefined, 
    mapperFn: (entity: TEntity) => TDTO
  ): TDTO[] {
    return entities ? entities.map(mapperFn) : [];
  }
}