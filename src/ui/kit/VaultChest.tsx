interface Props {
  count?: number;
  onOpen?: () => void;
}

export function VaultChest({ count = 12, onOpen }: Props) {
  return (
    <button type="button" class="kit-vault" onClick={onOpen}>
      <span class="kit-vault-art" aria-hidden="true">
        🧰
      </span>
      <span>
        <strong>Documents vault</strong>
        <span class="muted">{count} files · manuals, receipts, warranties</span>
      </span>
    </button>
  );
}
