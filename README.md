# Blog API

API to manage users, posts, and comments from a blog. Used in two different frontends.
## Introduction
This API was designed to be used easily in a complete blog application, with regular users and admin actions. 

## Demo
You can check the live preview of the API [here](https://theblogapi.onrender.com) \
It may take a few seconds to start running since Render (the host) puts services to sleep when inactive

## Tech Stack

Node, Express, MongoDB, Mongoose, Supabase.

## Features

- Auth system with JWT
- CRUD posts, users and comments
- Image uploading
- Key set pagination

## API Reference

#### Auth endpoints
| Endpoint | Method     | Description                       | Access |
| :-------- | :------- | :-------------------------------- | :------- | 
| /login      | POST | Login and get an access token | All
| /refresh      | POST | Refresh an access token with a refresh token | All

#### User endpoints
| Endpoint | Method     | Description                       | Access |
| :-------- | :------- | :-------------------------------- | :------- | 
| /user/:id      | GET | Fetch a single user | All |
| /users      | GET | Fetch users list. Paginable | All |
| /user/create      | POST | Create a user | All|
| /user/update      | POST | Update a user | Same user |
| /user/delete      | POST | Delete a user | Admin |
| /user/promote      | POST | Grant admin to a user | Admin |
| /user/demote      | POST | Revoke admin from a user | Admin |
| /user/ban      | POST | Ban a user | Admin |
| /user/ban      | POST | Remove ban from a user | Admin |

#### Comment endpoints
| Endpoint | Method     | Description                       |Access   |
| :-------- | :------- | :-------------------------------- | :------- | 
| /comments    | GET | Fetch comments list. Paginable | All
| /comment/:id    | GET | Fetch a single comment | All
| /comment/:id/update    | POST | Update a comment | Author or admin
| /comment/:id/delete    | POST | Delete a comment | Author or admin
| /comment/:id/comments    | GET | Fetch comment replies. Paginable | All
| /comment/:id/comments    | POST | Add reply to a comment | User

#### Post endpoints
| Endpoint | Method     | Description                       | Access      |
| :-------- | :------- | :-------------------------------- |:------- |
| /posts    | GET | Fetch posts list. Paginable | All
| /post/:id    | GET | Fetch a single post | All
| /post/:id/update    | POST | Update a post | Admin
| /post/:id/delete    | POST | Delete a post | Admin
| /post/:id/publish    | POST | Publish a post | Admin
| /post/:id/unpublish    | POST | Unpublish a post | Admin
| /post/:id/comments    | GET | Fetch post comments. Paginable | All
| /post/:id/comments    | POST | Add comment to a post | User
| /post/:id/save    | POST | Add post to user saved posts list | User
| /post/:id/unsave    | POST | Remove post from user saved posts list | User
| /post/:id/save    | POST | Check if user has post saved | User

#### Other endpoints
| Endpoint | Method     | Description                       | Access      |
| :-------- | :------- | :-------------------------------- |:------- |
| /image/upload    | POST | Upload an image | User
| /error/log    | POST | Logs an error report | All* 

## Database

This is the current design of the database being used in the project. \
<img width="351" alt="Blog database relation diagram" src="https://github.com/user-attachments/assets/3b303a65-285a-4a4e-b85b-28aa5933cb5c">


## Installation

#### Pre-requisites

You will need a MongoDB database and a Supabase database to run the project. \
For MongoDB, i recommend using [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database), which is a free database host. \
Supabase is also free, you can create your database from [it's page](https://supabase.com/)

#### Running locally

To run this project on your local machine, follow the steps:
1. Clone the repository:
```
git clone https://github.com/GabyAM/odin-blog-api
```
2. Once in the folder, install NPM dependencies:
```
npm install
```
3. Create a .env file in the root folder
4. Insert your secret data in the .env file, including the uri from your MongoDB database, the api url and key from your Supabase db and a token secret (any value)
```
AUTH_TOKEN_SECRET = your_token_secret
MONGODB_URI= mongodb+srv://user:password@cluster0.example.mongodb.net/?retryWrites=true&w=majority
SUPABASE_API_URL = your_supabase_api_url
SUPABASE_KEY = your_supabase_api_key   
```
5. Optionally, you can populate the MongoDB database by using the populatedb file
```
node populatedb.js your_mongodb_uri
```
6. Start the project in dev mode
```
npm run devStart
```

