import express from "express";
import dotenv, { config } from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
dotenv.config();
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { Configuration, OpenAIApi } from "openai";
const app = express();
app.use(cors());
app.use(bodyParser.json());

const model = new OpenAI({ openAIApiKey: process.env.OPENAI_API_KEY });

//initializing openAi Configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const generateImage = async (prompt) => {
  try {
    const image = await openai.createImage({
      prompt: prompt,
      n: 1,
      size: "256x256",
    });
    const imageUrl = image.data.data[0].url;
    return imageUrl;
  } catch (err) {
    console.log(err);
  }
};

app.post("/api/story", async (req, res) => {
  const { characters, plot, settings } = req.body;
  const names = characters?.name.map((el) => el);
  const appearance = characters?.appearance.map((el) => el);
  const backStory = characters?.details.map((el) => el);

  try {
    const template = `this is my uncompleted script for ${settings} story book - ${plot}. These are my characters for the book ${names} parse the array and get the characters, ${appearance} parse this array to get their respective appearances, and also parse this array ${backStory} to get their backstory. Complete the story end to end in a very professional way`;
    const prompt = new PromptTemplate({
      template: template,
      inputVariables: ["plot", "names", "appearance", "backStory"],
    });
    const chain = new LLMChain({ llm: model, prompt: prompt });
    const data = await chain.call({
      script: plot,
      characters: characters.name,
      appearance: characters.appearance,
      backstory: characters.backStory,
    });
    const image = await generateImage(
      "a handsome man sitting with laptop and a extra monitor wearing headphones in anime style"
    ); //=> to be dynamic
    // console.log(image, data);
    res.json({
      data: data,
      image: image,
    });
  } catch (err) {
    return res.status(404).json({
      status: "error",
      msg: err,
    });
  }
});

app.listen(process.env.PORT, () => {
  console.log("Server listening at", process.env.PORT);
});
