import { Button } from "./ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

type PaginationAndSize = {
  page: number
  size: number
}

type PaginationProps = {
  onPagination: (pagination: PaginationAndSize) => void
  pagination: PaginationAndSize,
  paginatedMetadata: {
    count: number
    hasNextPage: boolean
  }
}

const Pagination = ({ onPagination, pagination, paginatedMetadata }: PaginationProps) => {
  const startOffset = pagination.page * pagination.size + 1
  const endOffset = startOffset - 1 + pagination.size
  const actualOffset = Math.min(endOffset, paginatedMetadata.count)

  const label = `${startOffset} - ${actualOffset} of ${paginatedMetadata.count}`


  const handlePreviousPage = () => {
    onPagination({ ...pagination, page: pagination.page - 1 })
  }

  const handleNextPage = () => {
    onPagination({ ...pagination, page: pagination.page + 1 })
  }

  const handleChangeSize = (size: string) => {
    onPagination({ page: 0, size: parseInt(size) })
  }

  const previousButton = (
    <Button
      className="rounded-full"
      variant="outline"
      size="sm"
      disabled={pagination.page < 1}
      onClick={handlePreviousPage}>
      Previous
    </Button>)

  const nextButton = (
    <Button
      className="rounded-full"
      variant="outline"
      size="sm"
      disabled={!paginatedMetadata.hasNextPage}
      onClick={handleNextPage}>
      Next
    </Button>)


  const sizeButton = (
    <Select defaultValue={pagination.size.toString()} onValueChange={handleChangeSize}>
      <SelectTrigger className="h-[36px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">1</SelectItem>
        <SelectItem value="2">2</SelectItem>
        <SelectItem value="5">5</SelectItem>
        <SelectItem value="10">10</SelectItem>
        <SelectItem value="25">25</SelectItem>
        <SelectItem value="50">50</SelectItem>
        <SelectItem value="100">100</SelectItem>
      </SelectContent>
    </Select>
  );
  return (
    <div className="w-full max-w-[420px] flex justify-between items-center">
      <p>{label}</p>
      <div className="flex gap-2">
        {sizeButton}
        {previousButton}
        {nextButton}
      </div>
    </div>
  )
}

export { Pagination }
