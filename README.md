# Easy-React-Router

`Easy-React-Router` is an implementation of a file based Router for React.

_(It also works with Preact.)_

This project also includes `Lazy-Component-Importer` which automatically changes the import of components to lazy imports only by renaming the file with a `.lazy.tsx` extension.

## Features

- fully typed
- file based routing
- dynamic routes (with optional and mandatory parameters)
- automatic not found page
- route layout
- accessors for:
  - route parameters (optional and mandatory)
  - route path
  - route visibility
  - route loading state
- route link component
- optional use of document transition API
- manual route loading

## File based routing

This table shows the equivalence between routes and their respective path.

`/` in `File path` is `routes` directory.

| File path                         | Route Path                         | Example                     |
| --------------------------------- | ---------------------------------- | --------------------------- |
| `/` `index.tsx`                   | layout for `/`                     | `/`                         |
| `/` `index.index.tsx`             | `//`                               | _(hidden path)_             |
| `/` `index$id.tsx`                | `:id` _(`id` is optional)_         | `/?id=abc`, `/?id=123`, `/` |
| `/` `index.$id.tsx`               | `/:id` _(`id` is mandatory)_       | `/abc`, `/123`              |
| `/` `$id.tsx`                     | `/:id` _(`id` is mandatory)_       | `/abc`, `/123`              |
| `/` `404.tsx`                     | not found at `/`                   | _(automatic path)_          |
| `/` `(ignored-path).about.tsx`    | `/about`                           | `/about`                    |
| `/` `(ignored-path)/` `about.tsx` | `/about`                           | `/about`                    |
| `/` `posts.tsx`                   | layout for `/posts`                | `/posts`                    |
| `/` `posts/` `index.tsx`          | layout for `/posts`                | `/posts`                    |
| `/` `posts/` `index.index.tsx`    | `/posts//`                         | _(hidden path)_             |
| `/` `posts$id.tsx`                | `/posts:id` _(`id` is optional)_   | `/posts?id=abc`, `/posts`   |
| `/` `posts.$id.tsx`               | `/posts/:id` _(`id` is mandatory)_ | `/posts/abc`, `/posts/123`  |
| `/` `posts/` `$id.tsx`            | `/posts/:id` _(`id` is mandatory)_ | `/posts/abc`, `/posts/123`  |
| `/` `posts/` `404.tsx`            | not found at `/posts`              | _(automatic path)_          |

_If you weirdly need `/404` in your path, create a folder named `404`. Same for `index`._
