import api from './api';
import axios from 'axios';

export interface ImportedInvoiceItem {
	date: string;
	description: string;
	category: string;
	amount: number;
	owner: string;
	notes?: string | null;
}

export interface InvoiceImportResponse {
	raw_text: string;
	items: ImportedInvoiceItem[];
}

const getImportErrorMessage = (error: unknown, fallbackMessage: string) => {
	if (axios.isAxiosError(error)) {
		const detail = error.response?.data?.detail;
		if (typeof detail === 'string' && detail.trim()) {
			return detail;
		}
	}
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}
	return fallbackMessage;
};

interface ProcessTextPayload {
	content: string;
	cardName?: string;
	people: string[];
	referenceMonth: number;
	referenceYear: number;
}

interface ProcessDocumentPayload {
	file: File;
	cardName?: string;
	people: string[];
	referenceMonth: number;
	referenceYear: number;
}

export const invoiceImportService = {
	async processText(payload: ProcessTextPayload): Promise<InvoiceImportResponse> {
		try {
			const { data } = await api.post<InvoiceImportResponse>('/ai/process-invoice-text', {
				content: payload.content,
				card_name: payload.cardName,
				people: payload.people,
				reference_month: payload.referenceMonth,
				reference_year: payload.referenceYear,
			});
			return data;
		} catch (error) {
			throw new Error(getImportErrorMessage(error, 'Falha ao processar o texto com IA.'));
		}
	},

	async processDocument(payload: ProcessDocumentPayload): Promise<InvoiceImportResponse> {
		const formData = new FormData();
		formData.append('file', payload.file);
		formData.append('card_name', payload.cardName ?? '');
		formData.append('people_json', JSON.stringify(payload.people));
		formData.append('reference_month', String(payload.referenceMonth));
		formData.append('reference_year', String(payload.referenceYear));

		try {
			const { data } = await api.post<InvoiceImportResponse>('/ai/process-invoice-document', formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});
			return data;
		} catch (error) {
			throw new Error(getImportErrorMessage(error, 'Falha ao processar o arquivo com IA.'));
		}
	},
};

export default invoiceImportService;
