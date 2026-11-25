-- How the apps look for each account (see docs/API.md#appearance): its
-- theme (NULL: dark) and its accent (NULL: the theme's own).
ALTER TABLE users ADD COLUMN theme TEXT;
ALTER TABLE users ADD COLUMN accent TEXT;
