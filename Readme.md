# Code Pair
Code Pair is a clone of [HackerRank's CodePair](https://www.hackerrank.com/products/codepair/) platform. It provides an interactive Monaco Editor to write code and run it against a custom testcase. Users can edit code in realtime, similar to what Google docs provide.

### How real time editing works:
Real time editing is a two-way binding between server and client. This means there is a need of listener on both client side as well as server side. This might look very simple(Make a web socket listener and update the document). But, it is not the case. What happens when both the users edited the document at the same time? In that case, there is a possibility of storing ambiguous document. To solve this issue, we can use Operational Transformation.

According to [Wikipedia](https://en.wikipedia.org/wiki/Operational_transformation),
> **Operational transformation(OT)** is a technology for supporting a range of
> collaboration functionalities in advanced collaborative software systems. 
> OT was originally invented for consistency maintenance and concurrency control in collaborative editing of plain text documents.

### Code Pair uses the following packages to achieve OT: 
   - **[sharedb](https://github.com/share/sharedb):** sharedb provides a realtime database backend based on Operational Transformation(OT) of JSON documents.
   - **[json0](https://github.com/ottypes/json0):** json0 is used to edit arbitrary json documents.
   - **[sharedb-string-binding](https://github.com/share/sharedb-string-binding):** It provides two-way binding for json0 string operations for HTML text input or textarea.
   - **[text-diff-binding](https://github.com/share/text-diff-binding):** It is used to support sharedb-string-binding. It is a base class for binding text difference data operations to and from a HTML text input or textarea.

### Languages currently supported:
   - C++

### Completed Features:
   - **Real Time Editing:** Edit code in a real time monaco editor. Input and output are also real time.
   - **Run code:** Run code against a custom test case in currently supported languages.

### Features ToDo List 
   - **Private Channel:** Currently, code pair's editor is global. Anyone editing code in the editor will be visible to you. The task is to provide private channel so that users can invite other people by sharing the unique URL. 
   - **Video Calling:** Users can interact via video calling.
   - **Support for more languages:** Code pair currently supports C++ language.
   - **Rich text presence:** Highlight the cursor position of other user.
   - **Select questions from HackerRank and run all test cases:** Users can select questions from HackerRank and run all test cases against it (Maybe HackerRank provides an API for running all test cases).
   - **Proctoring control:** Detect when any user leaves the tab.
   