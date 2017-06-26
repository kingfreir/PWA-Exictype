## Exictype: Synopsis

This project is a chat application, based on Socket.io, with offline capabilities.
It includes a simple username sign in page and a global chat room. When offline,
you are capable of sending messages which will be stored and sent to server when
a connection is available.

## Motivation

Exictype was developed with the goal of testing Progressive Web Apps capabilities
such as Service Workers, IndexedDB, Cache API and Push Notifications.

## Note

If you you're running Development tools on Chrome with 'Update on Reload' selected, the app will prompt the user to confirm the SW installation when signing out of the chat page. This occurs since the login page is within the scope of the SW, and as such triggers the update on reload.

## Installation

In order to run the application it is required to have Node.js installed as well
as an available Redis server. You can edit the config.json file according to your
specified Redis server address.

Before running the server for the first time, you'll need to generate the bundle.js file by running the command: **npm run build** or **gulp build**

To run the server simply use the command: **npm run start**

If you would like to do some testing you can run the server in development mode by running the command: **gulp**

To see server output set debug environment variables to "redis,server,api". In Windows Powershell this is done by running **$env:DEBUG="redis,server,api"** on the same PS window you're running the server.
