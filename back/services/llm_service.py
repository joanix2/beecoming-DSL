from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser
from langchain.schema.runnable import RunnablePassthrough
from typing import Dict, Any, AsyncIterator
import json
from config import settings


class LLMService:
    """Service for interacting with Language Models using LangChain"""
    
    def __init__(self):
        self.enabled = bool(settings.OPENAI_API_KEY)
        
        if self.enabled:
            self.llm = ChatOpenAI(
                model=settings.OPENAI_MODEL,
                temperature=settings.OPENAI_TEMPERATURE,
                max_tokens=settings.OPENAI_MAX_TOKENS,
                streaming=True,
                api_key=settings.OPENAI_API_KEY
            )
        else:
            self.llm = None
        
        self.json_generation_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a helpful assistant that generates valid JSON based on user requests.
Always respond with valid JSON only, no additional text or explanation.
Ensure the JSON is properly formatted and can be parsed."""),
            ("user", "{input}")
        ])
        
        self.chat_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a helpful AI assistant specialized in software development and code generation.
You help users with programming questions, code scaffolding, and technical discussions.
Be concise and provide practical solutions."""),
            ("user", "{input}")
        ])
    
    def _check_enabled(self):
        """Check if LLM service is enabled"""
        if not self.enabled:
            raise ValueError(
                "LLM service is not enabled. Please set OPENAI_API_KEY in your environment variables or .env file."
            )
    
    async def generate_json(self, prompt: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate JSON output from a prompt
        
        Args:
            prompt: The user's request
            context: Additional context for the generation
            
        Returns:
            Generated JSON as a dictionary
        """
        self._check_enabled()
        
        full_prompt = prompt
        if context:
            full_prompt = f"Context: {json.dumps(context)}\n\nRequest: {prompt}"
        
        chain = (
            {"input": RunnablePassthrough()}
            | self.json_generation_prompt
            | self.llm
            | StrOutputParser()
        )
        
        result = await chain.ainvoke(full_prompt)
        
        # Parse the JSON response
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            # Try to extract JSON from the response if wrapped in text
            import re
            json_match = re.search(r'\{.*\}|\[.*\]', result, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            raise ValueError("Failed to parse JSON from LLM response")
    
    async def chat_stream(self, message: str, context: Dict[str, Any] = None) -> AsyncIterator[str]:
        """
        Stream chat responses using Server-Sent Events
        
        Args:
            message: The user's message
            context: Additional context for the chat
            
        Yields:
            Chunks of the response as they are generated
        """
        self._check_enabled()
        
        full_message = message
        if context:
            full_message = f"Context: {json.dumps(context)}\n\nMessage: {message}"
        
        chain = (
            {"input": RunnablePassthrough()}
            | self.chat_prompt
            | self.llm
        )
        
        async for chunk in chain.astream(full_message):
            if hasattr(chunk, 'content'):
                yield chunk.content
    
    async def generate_code_from_uml(self, uml_data: Dict[str, Any], target_language: str = "python") -> str:
        """
        Generate code from UML diagram data
        
        Args:
            uml_data: UML diagram data with classes and relations
            target_language: Target programming language
            
        Returns:
            Generated code suggestions
        """
        self._check_enabled()
        
        prompt = f"""Given the following UML class diagram data, provide suggestions for code generation in {target_language}.
Analyze the classes, attributes, methods, and relationships.

UML Data:
{json.dumps(uml_data, indent=2)}

Provide a brief analysis of the structure and any recommendations for the code generation."""
        
        chain = (
            {"input": RunnablePassthrough()}
            | self.chat_prompt
            | self.llm
            | StrOutputParser()
        )
        
        return await chain.ainvoke(prompt)


# Singleton instance
llm_service = LLMService()
