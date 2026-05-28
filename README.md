# Setup Zigflow Action

This GitHub Action installs the [Zigflow CLI](https://github.com/zigflow/zigflow)
on a GitHub Actions runner.

## Usage

To use this action, add the following step to your GitHub Actions workflow:

```yaml
steps:
  - name: Install Zigflow
    uses: zigflow/setup-zigflow

  - name: Validate a workflow
    run: zigflow validate ./workflow.yaml
```

By default, the action installs the latest version of Zigflow. You can specify
the version of Zigflow to install using the version input:

```yaml
steps:
  - name: Install Zigflow
    uses: zigflow/setup-zigflow
    with:
      version: v0.12.0
```

## License

This project is licensed under the Apache-2.0 License. See the [LICENSE](LICENSE)
file for details.
