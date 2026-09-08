import { Client } from "@opensearch-project/opensearch";

const esUrl = process.env.ELASTICSEARCH_URL || "http://localhost:9200";

export const esClient = new Client({
  node: esUrl,
  ssl: {
    rejectUnauthorized: false, // Cloud self-signed certificate compatibility
  },
});

const INDEX_NAME = "emails";

// 1. Initialize Index with Mappings
export const initElasticsearch = async () => {
  try {
    const { body: exists } = await esClient.indices.exists({
      index: INDEX_NAME,
    });
    if (!exists) {
      await esClient.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              id: { type: "keyword" },
              senderId: { type: "keyword" },
              recipient: { type: "text" },
              subject: { type: "text" },
              body: { type: "text" },
              status: { type: "keyword" },
              scheduledAt: { type: "date" },
            },
          },
        },
      });
      console.log(
        `🚀 [Elasticsearch] Index '${INDEX_NAME}' successfully created & ready!`,
      );
    } else {
      console.log(`✅ [Elasticsearch] Connected to index '${INDEX_NAME}'.`);
    }
  } catch (error: any) {
    console.warn(
      `⚠️ [Elasticsearch Notice] ${error.message} - fallback active.`,
    );
  }
};

// 2. Index or Update Email Document
export const indexEmail = async (emailData: any) => {
  try {
    await esClient.index({
      index: INDEX_NAME,
      id: emailData.id,
      body: {
        id: emailData.id,
        senderId: emailData.senderId,
        recipient: emailData.recipient,
        subject: emailData.subject,
        body: emailData.body,
        status: emailData.status || "SCHEDULED",
        scheduledAt: emailData.scheduledAt,
      },
      refresh: true,
    });
    console.log(`🔍 [ES Indexed] Email document ${emailData.id} synced.`);
  } catch (error: any) {
    console.warn(
      `[ES Indexing Notice] Failed to index ${emailData.id}:`,
      error.message,
    );
  }
};

// 3. Update Email Status to SENT
export const updateEmailStatusInES = async (id: string, status: string) => {
  try {
    await esClient.update({
      index: INDEX_NAME,
      id,
      body: {
        doc: { status },
      },
      refresh: true,
    });
  } catch (error) {
    // Graceful fallback
  }
};

// 4. Full-Text Search
export const searchEmailsInES = async (query: string, senderId?: string) => {
  try {
    const mustQueries: any[] = [
      {
        multi_match: {
          query,
          fields: ["recipient^3", "subject^2", "body"],
          fuzziness: "AUTO",
        },
      },
    ];

    if (senderId) {
      mustQueries.push({ term: { senderId } });
    }

    const { body } = await esClient.search({
      index: INDEX_NAME,
      body: {
        query: {
          bool: {
            must: mustQueries,
          },
        },
      },
    });

    return body.hits.hits.map((hit: any) => hit._source);
  } catch (error) {
    return null; // Triggers automatic DB fallback
  }
};
