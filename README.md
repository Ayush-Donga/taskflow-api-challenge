# TaskFlow API - Senior Backend Engineer Coding Challenge

## Introduction

Welcome to the TaskFlow API coding challenge! This project is designed to evaluate the skills of experienced backend engineers in identifying and solving complex architectural problems using our technology stack.

The TaskFlow API is a task management system with significant scalability, performance, and security challenges that need to be addressed. The codebase contains intentional anti-patterns and inefficiencies that require thoughtful refactoring and architectural improvements.

## Tech Stack

- **Language**: TypeScript
- **Framework**: NestJS
- **ORM**: TypeORM with PostgreSQL
- **Queue System**: BullMQ with Redis
- **API Style**: REST with JSON
- **Package Manager**: Bun
- **Testing**: Bun test

## Getting Started

### Prerequisites

- Node.js (v16+)
- Bun (latest version)
- PostgreSQL
- Redis

### Setup Instructions

1. Clone this repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Configure environment variables by copying `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   # Update the .env file with your database and Redis connection details
   ```
4. Database Setup:
   
   Ensure your PostgreSQL database is running, then create a database:
   ```bash
   # Using psql
   psql -U postgres
   CREATE DATABASE taskflow;
   \q
   
   # Or using createdb
   createdb -U postgres taskflow
   ```
   
   Build the TypeScript files to ensure the migrations can be run:
   ```bash
   bun run build
   ```

5. Run database migrations:
   ```bash
   # Option 1: Standard migration (if "No migrations are pending" but tables aren't created)
   bun run migration:run
   
   # Option 2: Force table creation with our custom script
   bun run migration:custom
   ```
   
   Our custom migration script will:
   - Try to run formal migrations first
   - If no migrations are executed, it will directly create the necessary tables
   - It provides detailed logging to help troubleshoot database setup issues

6. Seed the database with initial data:
   ```bash
   bun run seed
   ```
   
7. Start the development server:
   ```bash
   bun run start:dev
   ```

### Troubleshooting Database Issues

If you continue to have issues with database connections:

1. Check that PostgreSQL is properly installed and running:
   ```bash
   # On Linux/Mac
   systemctl status postgresql
   # or
   pg_isready
   
   # On Windows
   sc query postgresql
   ```

2. Verify your database credentials by connecting manually:
   ```bash
   psql -h localhost -U postgres -d taskflow
   ```

3. If needed, manually create the schema from the migration files:
   - Look at the SQL in `src/database/migrations/`
   - Execute the SQL manually in your database

### Default Users

The seeded database includes two users:

1. Admin User:
   - Email: admin@example.com
   - Password: admin123
   - Role: admin

2. Regular User:
   - Email: user@example.com
   - Password: user123
   - Role: user

## Challenge Overview

This codebase contains a partially implemented task management API that suffers from various architectural, performance, and security issues. Your task is to analyze, refactor, and enhance the codebase to create a production-ready, scalable, and secure application.

## Core Problem Areas

The codebase has been intentionally implemented with several critical issues that need to be addressed:

### 1. Performance & Scalability Issues

- N+1 query problems throughout the application
- Inefficient in-memory filtering and pagination that won't scale
- Excessive database roundtrips in batch operations
- Poorly optimized data access patterns

### 2. Architectural Weaknesses

- Inappropriate separation of concerns (e.g., controllers directly using repositories)
- Missing domain abstractions and service boundaries
- Lack of transaction management for multi-step operations
- Tightly coupled components with high interdependency

### 3. Security Vulnerabilities

- Inadequate authentication mechanism with several vulnerabilities
- Improper authorization checks that can be bypassed
- Unprotected sensitive data exposure in error responses
- Insecure rate limiting implementation

### 4. Reliability & Resilience Gaps

- Ineffective error handling strategies
- Missing retry mechanisms for distributed operations
- Lack of graceful degradation capabilities
- In-memory caching that fails in distributed environments

## Implementation Requirements

Your implementation should address the following areas:

### 1. Performance Optimization

- Implement efficient database query strategies with proper joins and eager loading
- Create a performant filtering and pagination system
- Optimize batch operations with bulk database operations
- Add appropriate indexing strategies

### 2. Architectural Improvements

- Implement proper domain separation and service abstractions
- Create a consistent transaction management strategy
- Apply SOLID principles throughout the codebase
- Implement at least one advanced pattern (e.g., CQRS, Event Sourcing)

### 3. Security Enhancements

- Strengthen authentication with refresh token rotation
- Implement proper authorization checks at multiple levels
- Create a secure rate limiting system
- Add data validation and sanitization

### 4. Resilience & Observability

- Implement comprehensive error handling and recovery mechanisms
- Add proper logging with contextual information
- Create meaningful health checks
- Implement at least one observability pattern

## Advanced Challenge Areas

For senior engineers, we expect solutions to also address:

### 1. Distributed Systems Design

- Create solutions that work correctly in multi-instance deployments
- Implement proper distributed caching with invalidation strategies
- Handle concurrent operations safely
- Design for horizontal scaling

### 2. System Reliability

- Implement circuit breakers for external service calls
- Create graceful degradation pathways for non-critical features
- Add self-healing mechanisms
- Design fault isolation boundaries

### 3. Performance Under Load

- Optimize for high throughput scenarios
- Implement backpressure mechanisms
- Create efficient resource utilization strategies
- Design for predictable performance under varying loads

## Evaluation Criteria

Your solution will be evaluated on:

1. **Problem Analysis**: How well you identify and prioritize the core issues
2. **Technical Implementation**: The quality and cleanliness of your code
3. **Architectural Thinking**: Your approach to solving complex design problems
4. **Performance Improvements**: Measurable enhancements to system performance
5. **Security Awareness**: Your identification and remediation of vulnerabilities
6. **Testing Strategy**: The comprehensiveness of your test coverage
7. **Documentation**: The clarity of your explanation of key decisions

## Submission Guidelines

1. Fork this repository to your own GitHub account
2. Make regular, meaningful commits that tell a story
3. Create a comprehensive README.md in your forked repository containing:
   - Analysis of the core problems you identified
   - Overview of your architectural approach
   - Performance and security improvements made
   - Key technical decisions and their rationale
   - Any tradeoffs you made and why
4. Ensure your repository is public so we can review your work
5. Submit the link to your public GitHub repository

## API Endpoints

The API should expose the following endpoints:

### Authentication
- `POST /auth/login` - Authenticate a user
- `POST /auth/register` - Register a new user

### Tasks
- `GET /tasks` - List tasks with filtering and pagination
- `GET /tasks/:id` - Get task details
- `POST /tasks` - Create a task
- `PATCH /tasks/:id` - Update a task
- `DELETE /tasks/:id` - Delete a task
- `POST /tasks/batch` - Batch operations on tasks

Good luck! This challenge is designed to test the skills of experienced engineers in creating scalable, maintainable, and secure systems.


# TaskFlow API

## Overview
This is a task management API built with NestJS, TypeORM, PostgreSQL, and Redis. The codebase has been refactored to address performance, scalability, security, and reliability issues.

## Problem Analysis
- **Performance**: N+1 queries, in-memory filtering, and inefficient batch operations were optimized with database-level queries, indexing, and bulk operations.
- **Architecture**: Separation of concerns was improved by removing repository access from controllers and introducing CQRS for read/write separation.
- **Security**: Rate limiting was moved to Redis, authentication was strengthened with refresh token rotation, and authorization was enhanced with role hierarchies.
- **Reliability**: Added circuit breakers, structured logging, health checks, and metrics for observability.
- **Distributed Systems**: Implemented Redis-based caching and concurrency control for multi-instance deployments.

## Architectural Approach
- **CQRS**: Separated read (`TaskQueryService`) and write (`TaskCommandService`) operations for better scalability.
- **SOLID Principles**: Introduced `TaskDomainService` for business logic, ensuring single responsibility.
- **Transaction Management**: Used TypeORM transactions for consistent multi-step operations.
- **Observability**: Added Prometheus metrics, structured logging with Winston, and health checks with Terminus.

## Key Technical Decisions
- **Redis for Rate Limiting and Caching**: Ensures scalability in distributed environments.
- **Circuit Breakers**: Protect against queue failures with graceful degradation.
- **Backpressure in BullMQ**: Limits queue processing to prevent overload.
- **Role Hierarchies**: Simplifies authorization logic.

## Tradeoffs
- **Complexity vs. Scalability**: CQRS adds complexity but improves read/write optimization.
- **Redis Dependency**: Increases infrastructure requirements but enables distributed features.
- **Circuit Breakers**: May delay retries but prevent cascading failures.

## Setup Instructions
1. Clone the repository.
2. Install dependencies: `bun install`.
3. Copy `.env.example` to `.env` and update with your credentials.
4. Run migrations: `bun run migration:run`.
5. Seed database: `bun run seed`.
6. Start server: `bun run start:dev`.

## API Endpoints
- **POST /auth/login**: Authenticate user.
- **POST /auth/register**: Register user.
- **POST /auth/refresh**: Refresh access token.
- **GET /tasks**: List tasks with filtering/pagination.
- **GET /tasks/:id**: Get task details.
- **POST /tasks**: Create task.
- **PATCH /tasks/:id**: Update task.
- **DELETE /tasks/:id**: Delete task.
- **POST /tasks/batch**: Batch process tasks.
- **GET /health**: Health check.
- **GET /health/metrics**: Prometheus metrics.

## Testing
- Unit tests: `bun run test`.
- Integration tests: `bun run test:e2e`.