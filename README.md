# SQL Query System

This repository contains a SQL Query System that uses LangChain and TypeORM to interact with a SQLite database. The system generates SQL queries based on user input, executes the queries, and provides answers based on the query results.

## Setup

1. Clone the repository:
    ```sh
    git clone <repository-url>
    cd sql-query
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Ensure you have the `Chinook.db` SQLite database in the root directory.

## Usage

To run the application, use the following command:
```sh
npx tsx main.ts
```

## Components

- **Database Setup**: Initializes a SQLite database using TypeORM.
- **State Annotations**: Defines the structure of the application state.
- **Language Model**: Uses ChatOllama for generating SQL queries and answers.
- **Prompt Template**: Pulls a prompt template from LangChain Hub.
- **Query Function**: Generates SQL queries based on user input.
- **Execute Query**: Executes the generated SQL queries.
- **Generate Answer**: Generates answers based on the query results.
- **State Graph**: Compiles the application logic into a state graph.

## Example

The following example demonstrates how to use the system to answer a question about the number of employees:

```typescript
let inputs = {
    question: "How many employees are there?"
};

for await (const step of await graph.stream(inputs, { streamMode: "updates" })) {
    console.log(step);
}
```

## License

This project is licensed under the MIT License.