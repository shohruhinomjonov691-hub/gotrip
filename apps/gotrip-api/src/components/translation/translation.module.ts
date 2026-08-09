import { Module } from '@nestjs/common';
import { AiTranslationService } from './ai-translation.service';
import { AnthropicTranslationProvider } from './providers/anthropic-translation.provider';
import { OpenAiTranslationProvider } from './providers/openai-translation.provider';

/**
 * Both providers stay registered (AnthropicTranslationProvider is cheap to
 * keep around and costs nothing unused) — AiTranslationService's constructor
 * is the single line that decides which one is actually wired in as
 * `this.provider`. This environment has OPENAI_API_KEY but not
 * ANTHROPIC_API_KEY, so OpenAiTranslationProvider is the active one (Phase
 * 4.6.1). Switching back is a one-line constructor-arg change, not a module
 * change, if Anthropic is configured later.
 */
@Module({
	providers: [AiTranslationService, AnthropicTranslationProvider, OpenAiTranslationProvider],
	exports: [AiTranslationService],
})
export class TranslationModule {}
