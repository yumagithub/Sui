export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          nickname: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          nickname?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          nickname?: string | null;
          avatar_url?: string | null;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          genre_ids: string[];
          area_ids: string[];
          behavior_pattern: 'morning' | 'night' | 'flexible' | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          genre_ids?: string[];
          area_ids?: string[];
          behavior_pattern?: 'morning' | 'night' | 'flexible' | null;
          updated_at?: string;
        };
        Update: {
          genre_ids?: string[];
          area_ids?: string[];
          behavior_pattern?: 'morning' | 'night' | 'flexible' | null;
          updated_at?: string;
        };
      };
      spots: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          area: string;
          latitude: number;
          longitude: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          area: string;
          latitude: number;
          longitude: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          area?: string;
          latitude?: number;
          longitude?: number;
        };
      };
      spot_photos: {
        Row: {
          id: string;
          spot_id: string;
          storage_path: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          spot_id: string;
          storage_path: string;
          order_index?: number;
        };
        Update: {
          storage_path?: string;
          order_index?: number;
        };
      };
      genres: {
        Row: {
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          name?: string;
          slug?: string;
        };
      };
      spot_genres: {
        Row: {
          spot_id: string;
          genre_id: string;
        };
        Insert: {
          spot_id: string;
          genre_id: string;
        };
        Update: never;
      };
      visits: {
        Row: {
          id: string;
          user_id: string;
          spot_id: string;
          visited_at: string;
          memo: string | null;
          photo_paths: string[];
        };
        Insert: {
          id?: string;
          user_id: string;
          spot_id: string;
          visited_at?: string;
          memo?: string | null;
          photo_paths?: string[];
        };
        Update: {
          visited_at?: string;
          memo?: string | null;
          photo_paths?: string[];
        };
      };
    };
  };
};
