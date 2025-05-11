import argparse
import sys
import numpy as np
import cv2
from tflite_support.task import core
from tflite_support.task import processor
from tflite_support.task import vision

if __name__ == '__main__':

  parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)
  parser.add_argument('--model')
  parser.add_argument('--threads', type=int)
  parser.add_argument('--threshold', type=float)
  parser.add_argument('--img')
  parser.add_argument('--path')
  args = parser.parse_args()

  detector = vision.ObjectDetector.create_from_options(vision.ObjectDetectorOptions(base_options=core.BaseOptions(file_name=args.model, use_coral=False, num_threads=int(args.threads)), detection_options=processor.DetectionOptions(max_results=100, score_threshold=float(args.threshold))))

  image = cv2.imread(args.img)
  rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
  detection_result = detector.detect(vision.TensorImage.create_from_array(rgb_image))
 
  person = False

  go = ""

  for detection in detection_result.detections:

    if detection.categories[0].category_name != "person":
      continue

    go += str(detection.categories[0].score) + ", "

    bbox = detection.bounding_box
    cv2.rectangle(image, (bbox.origin_x, bbox.origin_y), (bbox.origin_x + bbox.width, bbox.origin_y + bbox.height), (0, 0, 255), 3)
    cv2.circle(image, (round(bbox.origin_x + bbox.width / 2), round(bbox.origin_y + bbox.height / 2)), 3, (0, 255, 0), 1)

    person = True

  cv2.imwrite(args.path, image)

  if person:
    print("Person detected" + "\n" + go[:-2])
