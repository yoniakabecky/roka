<script lang="ts">
  import Dropzone from '$lib/components/Dropzone.svelte';

  const handleFile = (file: File) => {
    console.log('File selected:', file.name);
    // parsing will be added later
  }
</script>

<h1 class="sr-only">CSV Studio</h1>
<Dropzone onfile={handleFile} />
