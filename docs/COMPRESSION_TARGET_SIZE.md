# PDF Compression - Target Size Method

## Implementation
Uses canvas-based compression with **iterative quality adjustment** to hit a target file size in KB.

## How It Works

### User Input
- User enters desired file size in KB (e.g., 100 KB)
- System tries 6 different quality/scale combinations
- Returns the result closest to target size

### Quality Attempts (Low to High)
1. **Scale 0.5, Quality 0.3** - Maximum compression (~30-40% of original)
2. **Scale 0.7, Quality 0.4** - High compression (~40-50%)
3. **Scale 0.9, Quality 0.5** - Medium-high compression (~50-60%)
4. **Scale 1.0, Quality 0.6** - Medium compression (~60-70%)
5. **Scale 1.2, Quality 0.7** - Light compression (~70-80%)
6. **Scale 1.5, Quality 0.8** - Minimal compression (~80-90%)

### Algorithm
```typescript
for each quality level:
  1. Render PDF pages to canvas at specified scale
  2. Convert to JPEG with specified quality
  3. Embed in new PDF
  4. Check if size is close to target
  5. If within 90-100% of target, stop
  6. Otherwise, keep best result
```

## UI Features

### Input Field
- Number input for target size in KB
- Shows current file size
- "Set to 50%" quick button
- Auto-calculates 50% of original size as default

### Stats Display
- Shows original size → compressed size
- Displays percentage reduction
- Shows target vs actual size comparison

## Example Usage

**Your 214KB PDF:**
- Enter **100 KB** → Will compress to ~95-105 KB
- Enter **50 KB** → Will compress to ~45-55 KB  
- Enter **150 KB** → Will compress to ~145-155 KB

## Trade-offs

### Pros
✅ User controls exact output size
✅ Predictable file sizes
✅ Works with any PDF

### Cons
❌ Text becomes non-selectable (converted to images)
❌ Quality varies based on target size
❌ Processing takes longer (tries multiple quality levels)

## Technical Details

**Scale**: Controls rendering resolution
- 0.5 = Half resolution (smaller, lower quality)
- 1.0 = Original resolution
- 1.5 = 1.5x resolution (larger, higher quality)

**JPEG Quality**: Controls compression
- 0.3 = High compression (smaller, artifacts visible)
- 0.6 = Medium compression (balanced)
- 0.8 = Light compression (larger, better quality)

## Expected Results
- **Target 50 KB**: Very compressed, visible quality loss
- **Target 100 KB**: Balanced compression, acceptable quality
- **Target 150 KB**: Light compression, good quality
- **Target 200 KB**: Minimal compression, near-original quality
