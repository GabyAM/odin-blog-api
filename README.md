# Blog API

API to manage users, posts, and comments from a blog. Used in two different frontends.
## Introduction
This API was designed to be used easily in a complete blog application, with regular users and admin actions. 

## Tech Stack

Node, Express, MongoDB, Mongoose, Supabase.

## Features

- Auth system with JWT
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
