# RaceTrckr
Mobile Apps Final Project - RaceTrckr
RaceTrckr

Team:
  Ojas Siriseni
  Ashmeet Bedi
  Akshat Dev

App:
  It's an app that tracks the time it takes to travel between two points. Users can create routes and track runs using GPS.        While comparing times on leaderboards from different users. 

Project Goals:
  Use GPS (precision) tracking to track your car,
  Allow users to create and race routes,
  Make a leaderboard system,
  Ant-cheat system.
  
Key Features:
  Route Creation(point A to point B, Routes are stored and reusable),
  Race Tracking(Automatic start at point A and end at point B, tracks using precison GPS),
  Ghost Racing(Users go against fasterest run),
  Leaderboard(stores fastest runtimes for each route, displays ranking),
  Car Profiles(users can input vehicle details),
  Anti Cheat System(detects gps jumps).
  
Supabase setup:
  Copy .env.example to .env and add your Expo public Supabase values:
  EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

  The app gracefully falls back to the local RaceTrckr storage when Supabase is not configured, and the SQL migration under supabase/migrations/001_create_race_schema.sql is ready to apply in the Supabase dashboard.

Credits:
  This app was developed with the help and assistance of ChatGPT(GPT 5.3), Claude and Cursor. Which were used to help with code generation and debugging. All code was reviewed by students to check for understanding and correctness and usability.
