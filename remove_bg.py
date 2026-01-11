from PIL import Image
import sys

def remove_black_background(input_path, output_path, threshold=10):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # Check if the pixel is black (or very close to it)
        # item is (R, G, B, A)
        if item[0] <= threshold and item[1] <= threshold and item[2] <= threshold:
            # make it transparent
            newData.append((0, 0, 0, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved transparent image to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) > 2:
        input_file = sys.argv[1]
        output_file = sys.argv[2]
    else:
        # Default fallback
        input_file = "public/ai-agent-isolated.png"
        output_file = "public/ai-agent-transparent.png"
    
    remove_black_background(input_file, output_file)
