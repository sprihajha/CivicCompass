import json
import PyPDF2
import random
from datasets import Dataset
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_experimental.text_splitter import SemanticChunker
from langchain_nomic.embeddings import NomicEmbeddings


def get_args(file_name=".env"):
    args = {}
    try:
        with open(file_name, "r") as file:
            for line in file:
                line = line.strip()
                if line and not line.startswith("#"):
                    key, value = line.split("=", 1)
                    args[key] = value
    except FileNotFoundError:
        print(f"File '{file_name}' not found.")
    return args


def get_chunks(
    file_path: str, doctype="pdf", chunk_size=512, nomic_key=None
) -> list[str]:
    """
    Takes in a `file_path` and `doctype`, retrieves the document, breaks it down into chunks of size
    `chunk_size`, and returns the chunks.
    """
    chunks = []

    if doctype == "api":
        with open(file_path) as f:
            api_docs_json = json.load(f)
        chunks = list(api_docs_json)
        chunks = [str(api_doc_json) for api_doc_json in api_docs_json]

        for field in [
            "user_name",
            "api_name",
            "api_call",
            "api_version",
            "api_arguments",
            "functionality",
        ]:
            if field not in chunks[0]:
                raise TypeError(
                    f"API documentation is not in the format specified by the Gorilla API Store: Missing field `{field}`"
                )

    else:
        if doctype == "json":
            with open(file_path, "r") as f:
                data = json.load(f)
            text = data["text"]
        elif doctype == "pdf":
            text = ""
            with open(file_path, "rb") as file:
                reader = PyPDF2.PdfReader(file)
                num_pages = len(reader.pages)
                for page_num in range(num_pages):
                    page = reader.pages[page_num]
                    text += page.extract_text()
        elif doctype == "txt":
            with open(file_path, "r") as file:
                data = file.read()
            text = str(data)
        else:
            raise TypeError(
                "Document is not one of the accepted types: api, pdf, json, txt"
            )

        num_chunks = len(text) / chunk_size
        text_splitter = SemanticChunker(
            NomicEmbeddings(nomic_api_key=nomic_key, model="nomic-embed-text-v1.5"),
            number_of_chunks=num_chunks,
        )
        chunks = text_splitter.create_documents([text])
        chunks = [chunk.page_content for chunk in chunks]

    return chunks


def strip_str(s) -> str:
    """
    Helper function for helping format strings returned by GPT-4.
    """
    l, r = 0, len(s) - 1
    beg_found = False
    for i in range(len(s)):
        if s[i].isalpha():
            if not beg_found:
                l = i
                beg_found = True
            else:
                r = i
    r += 2
    return s[l : min(r, len(s))]


def generate_instructions_gen(chunk, anthropic_key, x=5) -> list[str]:
    """
    Generates `x` questions / use cases for `chunk`. Used when the input document is of general types
    `pdf`, `json`, or `txt`.
    """
    chat = ChatAnthropic(
        temperature=0,
        anthropic_api_key=anthropic_key,
        model_name="claude-3-opus-20240229",
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a synthetic question-answer pair generator. Given a chunk of context about some topic(s), generate {x} example questions a user could ask and would be answered using information from the chunk. For example, if the given context was a Wikipedia paragraph about the United States, an example question could be 'How many states are in the United States?'. The questions should be able to be answered in a few words or less.",
            ),
            ("human", "{chunk}"),
        ]
    )

    chain = prompt | chat
    response = chain.invoke(
        {
            "x": str(x),
            "chunk": str(chunk),
        }
    )

    queries = response.content.split("\n")
    queries = [strip_str(q) for q in queries]
    queries = [q for q in queries if any(c.isalpha() for c in q)]

    return queries


def encode_question_gen(question, chunk) -> list[str]:
    """
    Encode multiple prompt instructions into a single string for the general case (`pdf`, `json`, or `txt`).
    """

    prompts = []

    prompt = """
        Question: {question}\nContext: {context}\n
        Answer this question using the information given in the context above. Here is things to pay attention to: 
        - First provide step-by-step reasoning on how to answer the question. 
        - In the reasoning, if you need to copy paste some sentences from the context, include them in ##begin_quote## and ##end_quote##. This would mean that things outside of ##begin_quote## and ##end_quote## are not directly copy paste from the context. 
        - End your response with final answer in the form <ANSWER>: $answer, the answer should be succint.
    """.format(
        question=question, context=str(chunk)
    )
    prompts.append(
        (
            "system",
            "You are a helpful question answerer who can provide an answer given a question and relevant context.",
        )
    )
    prompts.append(("human", prompt))
    return prompts


def generate_label(question, context, anthropic_key, doctype="pdf") -> str:
    """
    Generates the label / answer to `question` using `context` and GPT-4.
    """
    question = encode_question_gen(question, context)
    chat = ChatAnthropic(
        temperature=0,
        anthropic_api_key=anthropic_key,
        model_name="claude-3-opus-20240229",
    )
    prompt = ChatPromptTemplate.from_messages(question)
    chain = prompt | chat
    response = chain.invoke({}).content
    # response = client.chat.completions.create(
    #     model="gpt-4", messages=question, n=1, temperature=0
    # )
    # response = response.choices[0].message.content
    return response


def add_chunk_to_dataset(
    anthropic_key,
    chunks: list,
    chunk: str,
    doctype: str = "api",
    x: int = 5,
    num_distract: int = 3,
    p: float = 1.0,
):
    """
    Given a chunk, create {Q, A, D} triplets and add them to the dataset.
    """
    global ds
    i = chunks.index(chunk)
    qs = generate_instructions_gen(chunk, anthropic_key, x)
    for q in qs:
        datapt = {
            "context": None,
            "question": None,
            "answer": None,
        }

        # add 4 distractor docs
        docs = [chunk]
        indices = list(range(0, len(chunks)))
        indices.remove(i)
        for j in random.sample(indices, num_distract):
            docs.append(chunks[j])
        # decides whether to add oracle document
        oracle = random.uniform(0, 1) < p
        if not oracle:
            docs[0] = chunks[random.sample(indices, 1)[0]]
        random.shuffle(docs)

        # construct model instruction
        context = ""
        for doc in docs:
            context += "<DOCUMENT>" + str(doc) + "</DOCUMENT>\n"
        datapt["context"] = context
        datapt["question"] = q
        # add answer to q
        datapt["answer"] = generate_label(q, chunk, anthropic_key, doctype)

        # add to dataset
        if not ds:
            datapt["context"] = [datapt["context"]]
            datapt["question"] = [datapt["question"]]
            datapt["answer"] = [datapt["answer"]]
            ds = Dataset.from_dict(datapt)
        else:
            ds = ds.add_item(datapt)


if __name__ == "__main__":
    # run code
    args = get_args()

    NOMIC_KEY = args["NOMIC_KEY"]
    ANTROPIC_KEY = args["ANTROPIC_KEY"]

    chat = ChatAnthropic(
        temperature=0,
        anthropic_api_key=args["ANTROPIC_KEY"],
        model_name="claude-3-opus-20240229",
    )

    # prompt = ChatPromptTemplate.from_messages([("human", "Tell me a joke about bear")])
    # chain = prompt | chat
    # print(chain.invoke({"topic": "bear"}).content)

    # client = OpenAI(
    #     api_key=OPENAPI_API_KEY,
    # )

    CHUNK_SIZE = int(args["CHUNK_SIZE"])
    NUM_DISTRACT_DOCS = int(args["DISTRACTORS"])

    chunks = get_chunks(args["DATAPATH"], args["DOCTYPE"], CHUNK_SIZE, NOMIC_KEY)
    # with open("list.txt", "r") as file:
    #     chunks_str = file.read()

    #     chunks = ast.literal_eval(chunks_str)

    # for chunk in chunks:
    #     generate_instructions_gen(chunk, anthropic_key=args["ANTROPIC_KEY"], x=5)
    #     print("chunk done")
    ds = None

    print(len(chunks))

    for chunk in chunks:
        add_chunk_to_dataset(
            args["ANTROPIC_KEY"],
            chunks,
            chunk,
            args["DOCTYPE"],
            int(args["QUESTIONS"]),
            NUM_DISTRACT_DOCS,
        )
        print("chunk done")

    # # Save as .arrow format
    # ds.save_to_disk(args.output)

    # Save as .jsonl format
    ds.to_json(args["OUTPUT"] + ".jsonl")
