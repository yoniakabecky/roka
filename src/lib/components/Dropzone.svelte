<script lang="ts">
  import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	
  let { onfile }: { onfile: (file: File) => void } = $props();

  let isDragging = $state(false);
  let fileInput: HTMLInputElement;

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    isDragging = true;
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    isDragging = false;
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) onfile(file);
  };

  const handleFileInput = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) onfile(file);
  };

  const openFilePicker = () => fileInput.click();
</script>

<div
  class="flex flex-1 items-stretch m-6"
  role="region"
  aria-label="File drop zone"
>
  <div
    class={[
      "flex flex-col items-center justify-center gap-4 w-full rounded-xl border-2 border-dashed bg-card p-12 transition-colors cursor-pointer",
      isDragging ? 'border-primary bg-primary/5' : 'border-border'
    ]}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="presentation"
    onclick={openFilePicker}
  >
    <FolderOpenIcon size={48} />

    <h2 class="text-2xl font-bold text-foreground">Drop any CSV here</h2>

    <p class="text-sm text-muted-foreground">Or click Import CSV to browse</p>

    <input
      bind:this={fileInput}
      type="file"
      accept=".csv,.tsv,.txt"
      class="hidden"
      onchange={handleFileInput}
    />
  </div>
</div>
