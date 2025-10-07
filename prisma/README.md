# Prisma Schema Documentation

This document describes the database schema for the Austral Worldbuilding Lab application, focusing on solutions and provocations.

## Core Models

### Solution
Represents solutions to problems identified on linked projects.

**Fields Purpose:**
- `title`, `description`, `problem`: Required fields for any solution created
- `impactLevel`, `impactDescription`: Optional fields - not everyone will know the impact when creating a solution

### Provocation
Questions or prompts that drive creative thinking and solution generation.

**Fields Purpose:**
- `question`: Required field - the core provocation question
- `content`: Optional JSON field - AI can return a description of the provocation for context, and a title for displaying it as a card with title

## Link Models

### ProjSolLink
Links projects to solutions with role-based with many-to-many relationships.

**Roles:**
- `GENERATED`: Project generates the solution
- `REFERENCE`: Reference relationship in case of future needs

**Design Note 1:** Solutions can only be created by projects, not vice versa. This unidirectional relationship is enforced by the enum design with GENERATED role. The purpose of the enum is in case of future needs.

**Design Note 2:** By default, solutions and projects are one-to-one. This approach allows for multiple solutions to be linked to a project in case of future needs.

### ProjProvLink
Links projects to provocations with role-based with many-to-many relationships.

**Roles:**
- `ORIGIN`: Provocation originates the project
- `GENERATED`: Project generates the provocation
- `REFERENCE`: Reference relationship in case of future needs

**Design Note:** By default, provocations and projects are one-to-one. This approach allows for multiple provocations to be linked to a project in case of future needs.

### SolProvLink
Links solutions to provocations in a many-to-many relationship.

**Purpose:** Despite having ProjSolLink (which links the root project to solutions), SolProvLink handles the possibility to reference which of all provocations from the timeline projects are associated with the solution.
