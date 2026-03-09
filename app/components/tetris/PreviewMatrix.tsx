type PreviewMatrixProps = {
  tone: string;
  label: string;
  matrix: boolean[][];
};

export function PreviewMatrix({ tone, label, matrix }: PreviewMatrixProps) {
  return (
    <div className="mini-matrix" data-tone={tone} aria-label={label}>
      {matrix.flatMap((row, rowIndex) =>
        row.map((filled, columnIndex) => (
          <div
            key={`${label}-${rowIndex}-${columnIndex}`}
            className="mini-cell"
            data-filled={filled}
          />
        )),
      )}
    </div>
  );
}
