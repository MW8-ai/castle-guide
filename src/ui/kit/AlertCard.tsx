interface Props {
  title?: string;
  body?: string;
  cta?: string;
  onCta?: () => void;
}

export function AlertCard({
  title = 'Rebate available',
  body = 'You may qualify for up to $600 on a heat pump system. Verify on IRS / DSIRE.',
  cta = 'View rebate',
  onCta,
}: Props) {
  return (
    <article class="kit-alert">
      <h3>{title}</h3>
      <p>{body}</p>
      <button type="button" class="kit-btn primary" onClick={onCta}>
        {cta}
      </button>
    </article>
  );
}
