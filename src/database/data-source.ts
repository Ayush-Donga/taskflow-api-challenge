import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { CreateInitialSchema1710752400000 } from './migrations/1710752400000-CreateInitialSchema';
import { AddRefreshTokenToUsers1718169600000 } from './migrations/1718169600000-AddRefreshTokenToUsers';
import { AddTaskIndexes1718263200000 } from './migrations/1718263200000-AddTaskIndexes';

// Load environment variables
dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'taskflow',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [
    CreateInitialSchema1710752400000,
    AddRefreshTokenToUsers1718169600000,
    AddTaskIndexes1718263200000,
  ],
  migrationsTableName: 'migrations',
  synchronize: false, // Important: Set to false for production
  logging: process.env.NODE_ENV === 'development',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
