import { SqlDatabase } from "langchain/sql_db";
import { DataSource } from "typeorm";
import { Annotation } from "@langchain/langgraph";
import { ChatOllama } from "@langchain/ollama";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { QuerySqlTool } from "langchain/tools/sql";
import { StateGraph } from "@langchain/langgraph";


// setup db
const datasource = new DataSource({
    type: "sqlite",
    database: "Chinook.db",
});

const db = await SqlDatabase.fromDataSourceParams({
    appDataSource: datasource,
});


// defining app state
const InputStateAnnotation = Annotation.Root({
    question: Annotation<string>,
});

const StateAnnotation = Annotation.Root({
    question: Annotation<string>,
    query: Annotation<string>,
    result: Annotation<string>,
    answer: Annotation<string>,
});


// model instantionation
const llm = new ChatOllama({
    model: "llama3.2:3b",
    temperature: 0,
});


// defining prompt template
const queryPromptTemplate = await pull<ChatPromptTemplate>("langchain-ai/sql-query-system-prompt");


// defining schema
const queryOutput = z.object({
    query: z.string().describe("Syntactically valid SQL query."),
});

const structuredLlm = llm.withStructuredOutput(queryOutput);


// query function
const writeQuery = async (state: typeof InputStateAnnotation.State) => {
    const promptValue = await queryPromptTemplate.invoke({
        dialect: db.appDataSourceOptions.type,
        top_k: 10,
        table_info: await db.getTableInfo(),
        input: state.question,
    });

    const result = await structuredLlm.invoke(promptValue);
    return { query: result.query };
};


// executing query
const executeQuery = async (state: typeof StateAnnotation.State) => {
    const executeQueryTool = new QuerySqlTool(db);
    return { result: await executeQueryTool.invoke(state.query) };
};


// generating answer
const generateAnswer = async (state: typeof StateAnnotation.State) => {
    const promptValue =
        "Given the following user question, corresponding SQL query, " +
        "and SQL result, answer the user question.\n\n" +
        `Question: ${state.question}\n` +
        `SQL Query: ${state.query}\n` +
        `SQL Result: ${state.result}\n`;

    const response = await llm.invoke(promptValue);
    return { answer: response.content };
};


// app compilation
const graphBuilder = new StateGraph({ stateSchema: StateAnnotation })
    .addNode("writeQuery", writeQuery)
    .addNode("executeQuery", executeQuery)
    .addNode("generateAnswer", generateAnswer)
    .addEdge("__start__", "writeQuery")
    .addEdge("writeQuery", "executeQuery")
    .addEdge("executeQuery", "generateAnswer")
    .addEdge("generateAnswer", "__end__");

const graph = graphBuilder.compile();


// testing
let inputs = {
    question: "How many employees are there?"
};

for await (const step of await graph.stream(inputs, { streamMode: "updates" })) {
    console.log(step);
}