"use client";

interface Props {
  teamId: number;
  teamName: string;
  className?: string;
}

export default function TeamCrest({ teamId, teamName, className = "w-6 h-6" }: Props) {
  return (
    <img
      src={`/api/crest/${teamId}`}
      alt={teamName}
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}
