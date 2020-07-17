# Peer Share
Peer Share is a code pair platform where users can share an interactive editor and write code together. It has language support for C++, Java and python. This application is based on the concept of operational transformation which forms the basis for a shared editor. Video calling is also provided within this application. It has some similar features as provided by [HackerRank's CodePair](https://www.hackerrank.com/products/codepair/) platform.

### Demo link: [https://codepair.netlify.app/](https://codepair.netlify.app/)

### Demo Video: 
[![Video not available](https://img.youtube.com/vi/jDBPh7Id1TU/hqdefault.jpg)](https://www.youtube.com/watch?v=jDBPh7Id1TU)

## Run Locally
### Frontend:
`cd editor && npm start`
### Backend:
`cd editor-backend && npm run dev`

## How real time editing works:
Real time editing is a two-way binding between server and client. This means there is a need of listener on both client side as well as server side. This might look very simple(Make a web socket listener and update the document). But, it is not the case. What happens when both the users edited the document at the same time? In that case, there is a possibility of storing ambiguous document. To solve this issue, we can use Operational Transformation.

According to [Wikipedia](https://en.wikipedia.org/wiki/Operational_transformation),
> **Operational transformation(OT)** is a technology for supporting a range of
> collaboration functionalities in advanced collaborative software systems. 
> OT was originally invented for consistency maintenance and concurrency control in collaborative editing of plain text documents.

## Code Pair uses the following packages to achieve OT: 
   - **[sharedb](https://github.com/share/sharedb):** sharedb provides a realtime database backend based on Operational Transformation(OT) of JSON documents.
   - **[json0](https://github.com/ottypes/json0):** json0 is used to edit arbitrary json documents.
   - **[sharedb-string-binding](https://github.com/share/sharedb-string-binding):** It provides two-way binding for json0 string operations for HTML text input or textarea.
   - **[text-diff-binding](https://github.com/share/text-diff-binding):** It is used to support sharedb-string-binding. It is a base class for binding text difference data operations to and from a HTML text input or textarea.

## Video Calling:
This project doesn't use any external plugins for video calling. Instead, it uses APIs provided by WebRTC standard.
 - A STUN server is used to get public IP address
 - A TURN server is used to relay traffic if direct connection(peer to peer) fails. Currently, 
   free TURN server is used for demonstration. 

## Languages currently supported:
   - C++
   - Java
   - Python 2.x

## Completed Features:
   - **Real Time Editing:** Edit code in a real time monaco editor. Input and output are also real time.
   - **Run code:** Run code against a custom test case in currently supported languages.
   - **Private Channel:** Only the users who have access to the unique URL can edit in the editor.
   - **Video Calling:** Users can interact via video calling.
   - **Rich text presence:** Highlight the cursor position of other user.

## Features ToDo List 
   - **Support for more languages:** Code pair currently supports C++, Java and Python.
   - **Select questions from HackerRank and run all test cases:** Users can select questions from HackerRank and run all test cases against it (Maybe HackerRank provides an API for running all test cases).
   - **Proctoring control:** Detect when any user leaves the tab.
   