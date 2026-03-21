export interface Table {
    [key: string]: TableRow;
}

export interface TableRow {
    team: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    gf: number;
    gd: number;
    ga: number;
    points: number;
    h2h: HeadToHead;
}

export interface HeadToHead {
    [key: string]: H2HRecord;
}

export interface H2HRecord {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    gf: number;
    ga: number;
}
