export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId?: string;
  readonly aggregateType?: string;
  readonly aggregateVersion?: number;
  readonly occurredAt: Date;
  readonly userId?: string;
  readonly metadata?: Record<string, any>;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly aggregateVersion: number = 1;
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId?: string,
    public readonly aggregateType?: string,
    public readonly userId?: string,
    public readonly metadata?: Record<string, any>,
  ) {
    this.eventId = this.generateEventId();
    this.eventType = this.constructor.name;
    this.occurredAt = new Date();
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
