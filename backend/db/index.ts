import { ChromaClient } from "chromadb";

const client = new ChromaClient();
const collection = await client.createCollection({
  name: 'knowledge_base'
});