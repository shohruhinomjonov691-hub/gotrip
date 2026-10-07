import { OpenAIChatProvider } from './openai-chat.provider';
import { MessageRole } from '../../../libs/enums/conversation.enum';
import { Locale } from '../../../libs/enums/locale.enum';

// The SDK client is replaced with a mock — no network call is ever made.
describe('OpenAIChatProvider request options', () => {
	const originalKey = process.env.OPENAI_API_KEY;
	let create: jest.Mock;
	let provider: OpenAIChatProvider;

	const baseRequest = {
		messages: [{ role: MessageRole.USER, content: 'Hi' }],
		locale: Locale.en,
	};

	beforeEach(() => {
		process.env.OPENAI_API_KEY = 'test-key-not-real';
		provider = new OpenAIChatProvider();
		create = jest.fn().mockResolvedValue({ choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] });
		(provider as unknown as { client: unknown }).client = { chat: { completions: { create } } };
	});

	afterAll(() => {
		if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
		else process.env.OPENAI_API_KEY = originalKey;
	});

	it('leaves SDK defaults untouched when no override is given (authenticated flow)', async () => {
		await provider.complete(baseRequest);

		expect(create.mock.calls[0][0].max_completion_tokens).toBe(700);
		expect(create.mock.calls[0][1]).toBeUndefined();
	});

	it('passes timeout, retries and max tokens when set (guest flow)', async () => {
		await provider.complete({ ...baseRequest, maxTokens: 400, timeoutMs: 30_000, maxRetries: 0 });

		expect(create.mock.calls[0][0].max_completion_tokens).toBe(400);
		expect(create.mock.calls[0][1]).toEqual({ timeout: 30_000, maxRetries: 0 });
	});
});
