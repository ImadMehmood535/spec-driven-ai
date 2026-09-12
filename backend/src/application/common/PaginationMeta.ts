import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty({ example: 1 })
  currentPage!: number;

  @ApiProperty({ example: 50 })
  pageSize!: number;

  @ApiProperty({ example: 123 })
  totalItems!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;

  static of(
    currentPage: number,
    pageSize: number,
    totalItems: number,
  ): PaginationMeta {
    const meta = new PaginationMeta();
    meta.currentPage = currentPage;
    meta.pageSize = pageSize;
    meta.totalItems = totalItems;
    meta.totalPages = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 0;
    return meta;
  }
}
