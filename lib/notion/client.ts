import "server-only";
import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function resolveDataSourceId(): Promise<string> {
  const database = await notion.databases.retrieve({
    database_id: process.env.NOTION_DATABASE_ID!,
  });

  const dataSourceId =
    "data_sources" in database ? database.data_sources[0]?.id : undefined;

  if (!dataSourceId) {
    throw new Error("Notion database has no queryable data source");
  }

  return dataSourceId;
}

export async function getAllNotionProducts(): Promise<PageObjectResponse[]> {
  const dataSourceId = await resolveDataSourceId();
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const result of response.results) {
      if (result.object === "page" && "properties" in result) {
        pages.push(result);
      }
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages;
}
