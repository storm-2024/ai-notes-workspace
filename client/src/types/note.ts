export interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  score?: number;
}

export interface AskResponse {
  status: string;
  answer: string;
  sources: Note[];
}
