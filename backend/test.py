import onnx

path = "checkpoints/score_number_net.onnx"
print("Loading:", path)

model = onnx.load(path)
print("Loaded OK. Now checking...")

onnx.checker.check_model(model)
print("Model check OK!")
