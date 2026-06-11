import type { Repository } from '../../types/repo';
import { FileList } from './FileList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
      <p className="text-[14px] text-muted-foreground">No {label} yet</p>
    </div>
  );
}

interface DetailTabsProps {
  repo: Repository;
}

export function DetailTabs({ repo }: DetailTabsProps) {
  return (
    <Tabs defaultValue="code">
      {/* Negative margins extend the scroll zone to the page edge on mobile */}
      <div className="relative">
        <div className="overflow-x-auto -mx-4 px-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <TabsList className="w-max min-w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto mb-6">
          <TabsTrigger
            value="code"
            className="relative rounded-none border-b-2 border-transparent px-3 sm:px-4 py-3 text-[13px] sm:text-[14px] font-normal text-muted-foreground transition-colors data-[state=active]:border-[var(--color-warm)] data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground whitespace-nowrap"
          >
            code
            <span className="ml-1.5 text-[11px] tabular-nums text-muted-foreground">
              {repo.files.length}
            </span>
          </TabsTrigger>
          {(['commits', 'pulls', 'issues', 'certs', 'events'] as const).map(id => (
            <TabsTrigger
              key={id}
              value={id}
              className="relative rounded-none border-b-2 border-transparent px-3 sm:px-4 py-3 text-[13px] sm:text-[14px] font-normal text-muted-foreground transition-colors data-[state=active]:border-[var(--color-warm)] data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground whitespace-nowrap"
            >
              {id}
            </TabsTrigger>
          ))}
        </TabsList>
        </div>
        {/* Right-edge fade — signals scrollable content on small screens */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent sm:hidden" />
      </div>

      <TabsContent value="code" className="animate-fade-in mt-0">
        <FileList files={repo.files} />
      </TabsContent>
      <TabsContent value="commits" className="animate-fade-in mt-0">
        <EmptyTab label="commits" />
      </TabsContent>
      <TabsContent value="pulls" className="animate-fade-in mt-0">
        <EmptyTab label="pull requests" />
      </TabsContent>
      <TabsContent value="issues" className="animate-fade-in mt-0">
        <EmptyTab label="issues" />
      </TabsContent>
      <TabsContent value="certs" className="animate-fade-in mt-0">
        <EmptyTab label="certificates" />
      </TabsContent>
      <TabsContent value="events" className="animate-fade-in mt-0">
        <EmptyTab label="events" />
      </TabsContent>
    </Tabs>
  );
}
