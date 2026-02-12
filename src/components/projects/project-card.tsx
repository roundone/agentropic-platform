import Link from "next/link";
import { Star } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Project } from "@/db/schema";

interface ProjectCardProps {
  project: Project;
}

function formatStars(count: number | null): string {
  if (!count) return "0";
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.slug}`} className="group">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            {project.category && (
              <Badge variant="secondary">{project.category}</Badge>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="size-3 fill-current" />
              {formatStars(project.stars)}
            </span>
          </div>
          <CardTitle className="mt-2 text-lg">{project.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-3">
            {project.description}
          </CardDescription>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <Button size="sm" variant="default">
            Try It
          </Button>
          {project.language && (
            <span className="text-xs text-muted-foreground">
              {project.language}
            </span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
