## Exictype: Synopsis

This project is a chat application, based on Socket.io, with offline capabilities.
It includes a simple username sign in page and a global chat room. When offline,
you are capable of sending messages which will be stored and sent to server when
a connection is available.

## Code Example

Show what the library does as concisely as possible, developers should be able to figure out **how** your project solves their problem by looking at the code example. Make sure the API you are showing off is obvious, and that your code is short and concise.

## Motivation

Exictype was developed with the goal of testing Progressive Web Apps capabilities
such as Service Workers, IndexedDB, Cache API and Push Notifications.

## Installation

In order to run the application it is required to have Node.js installed as well
as an available Redis server. You can edit the config.json file according to your
specified Redis server address.

To run the server simply use the command: **npm run start** or **gulp**
