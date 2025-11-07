import { OpenAI } from 'openai';
import { config } from '../lib/config';
import { logChatGPTRequest, logger } from '../lib/logger';

export interface ChatGPTEnrichmentRequest {
  companyName: string;
  apolloData?: any;
  websiteData?: any;
  missingFields?: string[];
  requestType: 'full_enrichment' | 'summary_only' | 'missing_data';
}

export interface ChatGPTEnrichmentData {
  businessSummary?: string;
  businessModel?: string;
  keyProducts?: string[];
  ceo?: string;
  parentCompany?: string;
  subsidiaries?: string[];
  keyDifferentiators?: string[];
  marketPosition?: string;
  recentDevelopments?: string[];
  strategicPartners?: string[];
  competitiveAdvantage?: string;
  industryContext?: string;
  missingDataFilled?: any;
  confidence?: number;
  enrichmentSource: 'chatgpt';
  processingTimeMs?: number;
}

export class ChatGPTService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async enrichCompanyData(request: ChatGPTEnrichmentRequest): Promise<ChatGPTEnrichmentData> {
    const startTime = Date.now();

    try {
      logChatGPTRequest('enrichCompanyData', {
        companyName: request.companyName,
        requestType: request.requestType
      }, true);

      let enrichmentData: ChatGPTEnrichmentData = {
        enrichmentSource: 'chatgpt',
        confidence: 0.7
      };

      if (request.requestType === 'full_enrichment' || request.requestType === 'summary_only') {
        const summary = await this.generateCompanySummary(request.companyName, request.apolloData || {});
        enrichmentData.businessSummary = summary;
      }

      const processingTime = Date.now() - startTime;
      enrichmentData.processingTimeMs = processingTime;

      logger.info('ChatGPT enrichment completed successfully', {
        companyName: request.companyName,
        processingTime
      });

      return enrichmentData;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      logger.error('ChatGPT enrichment failed', {
        companyName: request.companyName,
        error: error.message
      });

      return {
        enrichmentSource: 'chatgpt',
        confidence: 0.0,
        processingTimeMs: processingTime,
        businessSummary: `Unable to generate summary for ${request.companyName} due to API limitations.`
      };
    }
  }

  async generateCompanySummary(companyName: string, basicData: any): Promise<string> {
    try {
      logger.info('Generating company summary', { companyName });

      const prompt = `Generate a comprehensive, professional business summary for ${companyName}.

Available data:
${JSON.stringify(basicData, null, 2)}

Provide a 2-3 paragraph summary covering:
1. What the company does (core business, products/services)
2. Market position and key achievements
3. Business model and key differentiators

Keep it factual, professional, and informative.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a business analyst expert. Generate professional, factual company summaries based on available data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 800
      });

      const summary = completion.choices[0]?.message?.content?.trim() || 
        `${companyName} is a company operating in its respective industry.`;

      logger.info('Company summary generated successfully', {
        companyName,
        summaryLength: summary.length
      });

      return summary;

    } catch (error: any) {
      logger.error('Failed to generate company summary', {
        companyName,
        error: error.message
      });

      return `${companyName} is a company in the business sector.`;
    }
  }

  async fillMissingData(companyName: string, existingData: any, missingFields: string[]): Promise<any> {
    try {
      logger.info('Filling missing company data', {
        companyName,
        missingFields
      });

      const prompt = `Fill in the missing data for ${companyName} based on your knowledge.

Existing data:
${JSON.stringify(existingData, null, 2)}

Missing fields to fill:
${missingFields.join(', ')}

Please provide ONLY the missing data in JSON format. Be conservative and only include information you're confident about.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a business data expert. Provide accurate, factual company information in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content?.trim() || '{}';
      
      try {
        return JSON.parse(response);
      } catch {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : '{}';
        return JSON.parse(jsonString);
      }

    } catch (error: any) {
      logger.error('Failed to fill missing data', {
        companyName,
        error: error.message
      });

      return {};
    }
  }
}