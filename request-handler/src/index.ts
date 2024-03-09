import express from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { config } from "./config";
import path from "path";

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const app = express();

// Global routes catcher
app.get("/*", async (req, resp) => {
  console.log("host");
  const host = req.hostname;
  console.log("host: ", host);
  const id = host.split(".")[0];
  const filePath = req.path;
  console.log("filePath: ", path.join("dist", id, filePath));
  const getCommandInput = {
    Bucket: config.S3BucketName,
    Key: path.join("dist", id, filePath),
  };

  const getObjCommand = new GetObjectCommand(getCommandInput);
  const clientResponse = await client.send(getObjCommand);
  // console.log("response: ", clientResponse);
  const clientData = {
    // contentType: clientResponse.ContentType,
    // Optionally include processed Body content (see approach 3 below)
    // metadata: clientResponse.Body?.transformToString(),
  };
  const type = filePath.endsWith("html")
    ? "text/html"
    : filePath.endsWith("css")
    ? "text/css"
    : "application/javascript";
  resp.set("Content-type", type);
  resp.send(await clientResponse.Body?.transformToString());
});
console.log("Starting request service!");
app.listen(3001);
